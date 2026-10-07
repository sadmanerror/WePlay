from typing import List, Optional, Tuple
from datetime import datetime, timezone
import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text, delete
from sqlalchemy.orm import selectinload
from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_SetSRID, ST_Distance
from app.models.match import Match
from app.models.participant import MatchParticipant
from app.models.user import User
from app.models.chat import Message
from app.schemas.match import MatchCreate, MatchUpdate


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


async def get_by_id(db: AsyncSession, match_id: str) -> Optional[Match]:
    query = (
        select(Match)
        .options(
            selectinload(Match.host),
            selectinload(Match.participants).selectinload(MatchParticipant.user),
            selectinload(Match.sport),
            selectinload(Match.messages).selectinload(Message.user),
        )
        .where(Match.id == match_id)
    )
    result = await db.execute(query)
    return result.scalars().first()


async def list_matches(
    db: AsyncSession,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
    sports: Optional[List[str]] = None,
    date_str: Optional[str] = None,
    status_filter: Optional[List[str]] = None,
    limit: int = 50,
) -> List[Tuple[Match, Optional[float]]]:
    conditions = []
    
    if sports and len(sports) > 0:
        conditions.append(Match.sport_id.in_(sports))

    if status_filter and len(status_filter) > 0:
        conditions.append(Match.status.in_(status_filter))
    else:
        conditions.append(Match.status.in_(["open", "full"]))

    is_postgres = db.bind.dialect.name == "postgresql"

    distance_col = None
    if is_postgres and lat is not None and lng is not None and radius_km is not None:
        user_point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
        radius_meters = radius_km * 1000.0
        conditions.append(func.ST_DWithin(Match.location, func.cast(user_point, func.geography), radius_meters))
        distance_col = func.ST_Distance(Match.location, func.cast(user_point, func.geography)) / 1000.0

    query = (
        select(Match, distance_col) if distance_col is not None else select(Match)
    ).options(
        selectinload(Match.host),
        selectinload(Match.participants).selectinload(MatchParticipant.user),
        selectinload(Match.sport),
    )

    if conditions:
        query = query.where(and_(*conditions))

    if distance_col is not None:
        query = query.order_by(distance_col.asc())
    else:
        query = query.order_by(Match.date.asc())

    query = query.limit(limit)
    result = await db.execute(query)

    matches_with_dist = []
    if distance_col is not None:
        rows = result.all()
        for match_obj, dist in rows:
            if match_obj.is_ended or match_obj.status in ("completed", "cancelled"):
                continue
            matches_with_dist.append((match_obj, float(dist) if dist is not None else None))
    else:
        rows = result.scalars().all()
        for match_obj in rows:
            if match_obj.is_ended or match_obj.status in ("completed", "cancelled"):
                continue
            dist = None
            if lat is not None and lng is not None:
                dist = haversine_km(lat, lng, match_obj.latitude, match_obj.longitude)
                if radius_km is not None and dist > radius_km:
                    continue
            matches_with_dist.append((match_obj, dist))

        if lat is not None and lng is not None:
            matches_with_dist.sort(key=lambda x: x[1] if x[1] is not None else 999999)

    return matches_with_dist


async def create(db: AsyncSession, obj_in: MatchCreate, host_user: User) -> Match:
    point_wkt = f"SRID=4326;POINT({obj_in.location.lng} {obj_in.location.lat})"
    
    match = Match(
        host_id=host_user.id,
        sport_id=obj_in.sport_id,
        title=obj_in.title,
        venue_name=obj_in.venue_name,
        latitude=obj_in.location.lat,
        longitude=obj_in.location.lng,
        location=point_wkt,
        date=obj_in.date,
        duration_minutes=obj_in.duration_minutes,
        max_players=obj_in.max_players,
        current_players=1,
        max_spectators=obj_in.max_spectators,
        current_spectators=0,
        entry_fee=obj_in.entry_fee or 0.0,
        min_reliability=obj_in.min_reliability or 0,
        is_tournament=obj_in.is_tournament or False,
        tournament_name=obj_in.tournament_name,
        organized_by=getattr(obj_in, "organized_by", None) or getattr(obj_in, "organizedBy", None) or host_user.name,
        contact_details=getattr(obj_in, "contact_details", None) or getattr(obj_in, "contactDetails", None),
        description=obj_in.description or "",
        status="open",
    )

    db.add(match)
    await db.flush()

    host_participant = MatchParticipant(
        match_id=match.id,
        user_id=host_user.id,
        role="player",
        status="confirmed",
    )
    db.add(host_participant)
    await db.commit()

    return await get_by_id(db, match.id)


async def update(db: AsyncSession, db_obj: Match, obj_in: MatchUpdate) -> Match:
    update_data = obj_in.model_dump(exclude_unset=True)
    if "location" in update_data and update_data["location"] is not None:
        loc = update_data.pop("location")
        db_obj.latitude = loc["lat"]
        db_obj.longitude = loc["lng"]
        db_obj.location = f"SRID=4326;POINT({loc['lng']} {loc['lat']})"

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    await db.commit()
    return await get_by_id(db, db_obj.id)


async def cancel(db: AsyncSession, db_obj: Match) -> Match:
    db_obj.status = "cancelled"
    await db.commit()
    return await get_by_id(db, db_obj.id)


async def rsvp_participant(
    db: AsyncSession,
    match_id: str,
    user: User,
    role: str = "player"
) -> Tuple[Match, MatchParticipant]:
    lock_query = select(Match).where(Match.id == match_id).with_for_update()
    result = await db.execute(lock_query)
    match = result.scalars().first()

    if not match:
        raise ValueError("Match not found")

    if role == "player":
        if match.status != "open":
            raise ValueError(f"Cannot join as player: status is {match.status}")
    else:
        if match.status in ("cancelled", "completed"):
            raise ValueError(f"Cannot join match: status is {match.status}")


    # Enforce Host's minimum reliability karma filter for active players
    if role == "player" and match.min_reliability > 0:
        if user.reliability_score < match.min_reliability:
            raise ValueError(
                f"This match requires a minimum reliability karma score of {match.min_reliability}%. "
                f"Your score is {user.reliability_score}%. You can still join as a spectator/cheerer!"
            )

    part_query = select(MatchParticipant).where(
        MatchParticipant.match_id == match_id,
        MatchParticipant.user_id == user.id,
    )
    existing_result = await db.execute(part_query)
    existing_participant = existing_result.scalars().first()

    if existing_participant:
        if existing_participant.status == "confirmed":
            raise ValueError("You are already confirmed in this match")
        else:
            existing_participant.status = "confirmed"
            existing_participant.role = role
            participant = existing_participant
    else:
        if role == "player":
            if match.current_players >= match.max_players:
                raise ValueError("All player slots are filled for this match")
        elif role == "spectator":
            if match.max_spectators and match.current_spectators >= match.max_spectators:
                raise ValueError("Spectator capacity reached")

        participant = MatchParticipant(
            match_id=match.id,
            user_id=user.id,
            role=role,
            status="confirmed",
        )
        db.add(participant)

    if role == "player":
        match.current_players += 1
        if match.current_players >= match.max_players:
            match.status = "full"
    else:
        match.current_spectators += 1

    await db.commit()

    fresh_match = await get_by_id(db, match_id)
    return fresh_match, participant


async def cancel_rsvp(
    db: AsyncSession,
    match_id: str,
    user_id: str
) -> Match:
    lock_query = select(Match).where(Match.id == match_id).with_for_update()
    result = await db.execute(lock_query)
    match = result.scalars().first()

    if not match:
        raise ValueError("Match not found")

    part_query = select(MatchParticipant).where(
        MatchParticipant.match_id == match_id,
        MatchParticipant.user_id == user_id,
        MatchParticipant.status == "confirmed",
    )
    existing_result = await db.execute(part_query)
    existing_participant = existing_result.scalars().first()

    if not existing_participant:
        raise ValueError("You do not have a confirmed reservation for this match")

    role = existing_participant.role
    await db.delete(existing_participant)

    if role == "player":
        match.current_players = max(0, match.current_players - 1)
        if match.current_players < match.max_players and match.status == "full":
            match.status = "open"
    else:
        match.current_spectators = max(0, match.current_spectators - 1)

    await db.commit()

    return await get_by_id(db, match_id)


# ============================================================
# Phase 2: Lobby Chat with Auto-Erase on Match End
# ============================================================

async def get_match_messages(db: AsyncSession, match: Match) -> List[Message]:
    """
    Returns messages. If match has ended, erases all chat history and returns empty list.
    """
    if match.is_ended:
        # Event time ended -> delete all chats for this match
        await db.execute(delete(Message).where(Message.match_id == match.id))
        await db.commit()
        return []

    query = (
        select(Message)
        .options(selectinload(Message.user))
        .where(Message.match_id == match.id)
        .order_by(Message.created_at.asc())
    )
    result = await db.execute(query)
    return result.scalars().all()


async def send_match_message(db: AsyncSession, match: Match, user: User, content: str) -> Message:
    if match.is_ended:
        raise ValueError("This match event has ended. The lobby chatroom is closed and messages have been erased.")

    # Check that user is host or confirmed participant
    is_host = match.host_id == user.id
    is_participant = any(p.user_id == user.id and p.status == "confirmed" for p in (match.participants or []))
    if not (is_host or is_participant):
        raise PermissionError("Only confirmed players and spectators can chat in this lobby.")

    msg = Message(
        match_id=match.id,
        user_id=user.id,
        content=content,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    # Load user relation
    user_res = await db.execute(select(User).where(User.id == user.id))
    msg.user = user_res.scalars().first()
    return msg


async def mark_attendance(
    db: AsyncSession,
    match: Match,
    attendance_items: List[dict]
) -> Match:
    """
    Host marks attendance after match:
    - attended: reliability karma +2 (max 100), matches_played +1
    - no_show: reliability karma -15 (min 0)
    """
    status_map = {item["user_id"]: item["status"] for item in attendance_items}

    for p in (match.participants or []):
        if p.user_id in status_map:
            new_status = status_map[p.user_id]
            p.status = new_status
            if p.user:
                if new_status == "attended":
                    p.user.reliability_score = min(100, p.user.reliability_score + 2)
                    p.user.matches_played += 1
                elif new_status == "no_show":
                    p.user.reliability_score = max(0, p.user.reliability_score - 15)

    match.status = "completed"
    await db.commit()
    return await get_by_id(db, match.id)
