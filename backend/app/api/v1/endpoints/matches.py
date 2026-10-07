from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.match import (
    MatchCreate, MatchUpdate, MatchOut, RSVPInput, LatLng,
    MatchParticipantOut, AttendanceSubmit
)
from app.schemas.chat import MessageCreate, MessageOut
from app.schemas.user import UserOut
from app.crud import crud_match
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.websockets.manager import ws_manager

router = APIRouter()


def match_to_schema(match_obj, distance: Optional[float] = None) -> MatchOut:
    participants = []
    if match_obj.participants:
        for p in match_obj.participants:
            participants.append(
                MatchParticipantOut(
                    id=p.id,
                    user_id=p.user_id,
                    userId=p.user_id,
                    role=p.role,
                    status=p.status,
                    joined_at=p.joined_at,
                    joinedAt=p.joined_at,
                    user=UserOut.model_validate(p.user),
                )
            )

    return MatchOut(
        id=match_obj.id,
        host_id=match_obj.host_id,
        hostId=match_obj.host_id,
        sport_id=match_obj.sport_id,
        sportId=match_obj.sport_id,
        title=match_obj.title,
        venue_name=match_obj.venue_name,
        venueName=match_obj.venue_name,
        location=LatLng(lat=match_obj.latitude, lng=match_obj.longitude),
        date=match_obj.date,
        duration_minutes=match_obj.duration_minutes,
        durationMinutes=match_obj.duration_minutes,
        max_players=match_obj.max_players,
        maxPlayers=match_obj.max_players,
        current_players=match_obj.current_players,
        currentPlayers=match_obj.current_players,
        max_spectators=match_obj.max_spectators,
        maxSpectators=match_obj.max_spectators,
        current_spectators=match_obj.current_spectators,
        currentSpectators=match_obj.current_spectators,
        entry_fee=match_obj.entry_fee,
        entryFee=match_obj.entry_fee,
        min_reliability=getattr(match_obj, "min_reliability", 0) or 0,
        minReliability=getattr(match_obj, "min_reliability", 0) or 0,
        is_tournament=getattr(match_obj, "is_tournament", False) or False,
        isTournament=getattr(match_obj, "is_tournament", False) or False,
        tournament_name=getattr(match_obj, "tournament_name", None),
        tournamentName=getattr(match_obj, "tournament_name", None),
        organized_by=getattr(match_obj, "organized_by", None),
        organizedBy=getattr(match_obj, "organized_by", None),
        contact_details=getattr(match_obj, "contact_details", None),
        contactDetails=getattr(match_obj, "contact_details", None),
        is_ended=match_obj.is_ended,
        isEnded=match_obj.is_ended,
        description=match_obj.description or "",
        status=match_obj.status,
        created_at=match_obj.created_at,
        createdAt=match_obj.created_at,

        distance=round(distance, 2) if distance is not None else None,
        host=UserOut.model_validate(match_obj.host) if match_obj.host else None,
        participants=participants,
    )


@router.get("/", response_model=List[MatchOut])
async def list_matches(
    lat: Optional[float] = Query(None, description="User latitude for radius search"),
    lng: Optional[float] = Query(None, description="User longitude for radius search"),
    radius: Optional[float] = Query(None, description="Search radius in kilometers (1, 2, 5, 10)"),
    sports: Optional[List[str]] = Query(None, description="Sport filter list"),
    status: Optional[List[str]] = Query(None, description="Match status filter"),
    db: AsyncSession = Depends(get_db),
):
    matches_with_dist = await crud_match.list_matches(
        db=db,
        lat=lat,
        lng=lng,
        radius_km=radius,
        sports=sports,
        status_filter=status,
    )
    return [match_to_schema(m, dist) for m, dist in matches_with_dist]


@router.get("/{match_id}", response_model=MatchOut)
async def get_match_detail(
    match_id: str,
    db: AsyncSession = Depends(get_db),
):
    match = await crud_match.get_by_id(db, match_id=match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found",
        )
    return match_to_schema(match)


@router.post("/", response_model=MatchOut, status_code=status.HTTP_201_CREATED)
async def create_match(
    match_in: MatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    host_user = current_user
    organizer_name = (match_in.organized_by or "").strip() or (current_user.name if current_user else "Event Organizer")
    if not host_user:
        import re
        slug = re.sub(r'[^a-zA-Z0-9]', '', organizer_name.lower()) or "organizer"
        user_email = f"{slug}@weplay.com"
        from app.crud import crud_user
        from app.core.security import get_password_hash
        host_user = await crud_user.get_by_email(db, user_email)
        if not host_user:
            host_user = User(
                id=f"u-{slug}",
                email=user_email,
                name=organizer_name,
                hashed_password=get_password_hash("password123"),
                reliability_score=100,
                preferred_sports=[match_in.sport_id],
            )
            db.add(host_user)
            await db.commit()
            await db.refresh(host_user)
    elif match_in.organized_by and match_in.organized_by.strip():
        host_user.name = match_in.organized_by.strip()
        await db.commit()
        await db.refresh(host_user)

    match = await crud_match.create(db, obj_in=match_in, host_user=host_user)
    host_user.matches_hosted = (host_user.matches_hosted or 0) + 1
    await db.commit()

    await ws_manager.broadcast_slot_update(
        match_id=match.id,
        current_players=match.current_players,
        max_players=match.max_players,
        status=match.status,
    )
    return match_to_schema(match)


@router.patch("/{match_id}", response_model=MatchOut)
async def update_match(
    match_id: str,
    match_in: MatchUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = await crud_match.get_by_id(db, match_id=match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    if match.host_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit matches you host")

    updated = await crud_match.update(db, db_obj=match, obj_in=match_in)
    await ws_manager.broadcast_slot_update(
        match_id=updated.id,
        current_players=updated.current_players,
        max_players=updated.max_players,
        status=updated.status,
    )
    return match_to_schema(updated)


@router.delete("/{match_id}", response_model=MatchOut)
async def cancel_match(
    match_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = await crud_match.get_by_id(db, match_id=match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    if match.host_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel matches you host")

    cancelled = await crud_match.cancel(db, db_obj=match)
    await ws_manager.broadcast_slot_update(
        match_id=cancelled.id,
        current_players=cancelled.current_players,
        max_players=cancelled.max_players,
        status="cancelled",
    )
    return match_to_schema(cancelled)


@router.post("/{match_id}/rsvp", response_model=MatchOut)
async def rsvp_match(
    match_id: str,
    rsvp_in: RSVPInput,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    import re
    from datetime import datetime
    from app.core.security import get_password_hash
    from app.crud import crud_user

    joining_user = current_user
    if not joining_user:
        username = (rsvp_in.username or "").strip() or "Athlete"
        slug = re.sub(r'[^a-zA-Z0-9]', '', username.lower()) or "player"
        user_email = f"{slug}@weplay.com"
        joining_user = await crud_user.get_by_email(db, user_email)
        if not joining_user:
            joining_user = await crud_user.get_by_id(db, f"u-{slug}")
        if not joining_user:
            joining_user = User(
                id=f"u-{slug}",
                email=user_email,
                name=username,
                hashed_password=get_password_hash("password123"),
                reliability_score=100,
                preferred_sports=["cricket", "football"],
            )
            db.add(joining_user)
            await db.commit()
            await db.refresh(joining_user)
    elif rsvp_in.username and rsvp_in.username.strip():
        joining_user.name = rsvp_in.username.strip()
        await db.commit()
        await db.refresh(joining_user)

    # Check if match exists and if user is already confirmed
    target_match = await crud_match.get_by_id(db, match_id=match_id)
    if not target_match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    if target_match.participants:
        for p in target_match.participants:
            if p.status == "confirmed":
                if p.user_id == joining_user.id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"You are already confirmed in this match."
                    )
                if p.user and p.user.name.strip().lower() == joining_user.name.strip().lower():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Player '{joining_user.name}' is already registered in this match."
                    )

    try:
        updated_match, participant = await crud_match.rsvp_participant(
            db=db,
            match_id=match_id,
            user=joining_user,
            role=rsvp_in.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    await ws_manager.broadcast_slot_update(
        match_id=updated_match.id,
        current_players=updated_match.current_players,
        max_players=updated_match.max_players,
        status=updated_match.status,
    )
    return match_to_schema(updated_match)


@router.delete("/{match_id}/rsvp", response_model=MatchOut)
async def cancel_my_rsvp(
    match_id: str,
    user_id: Optional[str] = Query(None, description="User ID to cancel RSVP for"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    target_user_id = user_id or (current_user.id if current_user else None)
    if not target_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID is required to leave match")

    try:
        updated_match = await crud_match.cancel_rsvp(
            db=db,
            match_id=match_id,
            user_id=target_user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    await ws_manager.broadcast_slot_update(
        match_id=updated_match.id,
        current_players=updated_match.current_players,
        max_players=updated_match.max_players,
        status=updated_match.status,
    )
    return match_to_schema(updated_match)


# ============================================================
# Phase 2: Lobby Chat & Auto-Erase on Match End
# ============================================================

@router.get("/{match_id}/messages", response_model=List[MessageOut])
async def get_match_messages_endpoint(
    match_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = await crud_match.get_by_id(db, match_id=match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    messages = await crud_match.get_match_messages(db, match=match)
    return [
        MessageOut(
            id=m.id,
            match_id=m.match_id,
            matchId=m.match_id,
            user_id=m.user_id,
            userId=m.user_id,
            content=m.content,
            created_at=m.created_at,
            createdAt=m.created_at,
            user=UserOut.model_validate(m.user),
        )
        for m in messages
    ]


@router.post("/{match_id}/messages", response_model=MessageOut)
async def post_match_message_endpoint(
    match_id: str,
    msg_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = await crud_match.get_by_id(db, match_id=match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    try:
        msg = await crud_match.send_match_message(db, match=match, user=current_user, content=msg_in.content)
    except ValueError as e:
        # Event has ended
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    out = MessageOut(
        id=msg.id,
        match_id=msg.match_id,
        matchId=msg.match_id,
        user_id=msg.user_id,
        userId=msg.user_id,
        content=msg.content,
        created_at=msg.created_at,
        createdAt=msg.created_at,
        user=UserOut.model_validate(current_user),
    )

    # Broadcast to match chat via WebSocket
    await ws_manager.broadcast_to_match(match_id, {
        "type": "CHAT_MESSAGE",
        "message": out.model_dump(mode="json"),
    })
    return out


# ============================================================
# Phase 2: Host Attendance & Reliability Karma
# ============================================================

@router.post("/{match_id}/attendance", response_model=MatchOut)
async def mark_match_attendance_endpoint(
    match_id: str,
    attendance_in: AttendanceSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = await crud_match.get_by_id(db, match_id=match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    if match.host_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the match host can mark attendance")

    updated = await crud_match.mark_attendance(
        db,
        match=match,
        attendance_items=[item.model_dump() for item in attendance_in.attendance]
    )
    return match_to_schema(updated)
