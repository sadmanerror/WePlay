from typing import List, Optional
from datetime import datetime, timezone
import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from sqlalchemy.orm import selectinload
from app.models.venue import Venue, VenueSlot, VenueReservation
from app.models.user import User


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


async def list_venues(
    db: AsyncSession,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
    sport: Optional[str] = None,
    limit: int = 50,
) -> List[Venue]:
    query = select(Venue).options(selectinload(Venue.slots))
    
    conditions = []
    if sport:
        conditions.append(Venue.sports.ilike(f"%{sport}%"))

    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query.limit(limit))
    venues = result.scalars().all()

    if lat is not None and lng is not None:
        venues = sorted(
            venues,
            key=lambda v: haversine_km(lat, lng, v.latitude, v.longitude)
        )

    return venues


async def get_by_id(db: AsyncSession, venue_id: str) -> Optional[Venue]:
    query = (
        select(Venue)
        .options(selectinload(Venue.slots))
        .where(Venue.id == venue_id)
    )
    result = await db.execute(query)
    return result.scalars().first()


async def create_venue(
    db: AsyncSession,
    name: str,
    address: str,
    lat: float,
    lng: float,
    sports: List[str],
    hourly_rate: float = 1200.0,
    owner_id: Optional[str] = None,
    image_url: Optional[str] = None,
    contact_person: Optional[str] = None,
    contact_phone: Optional[str] = None,
    surface_type: Optional[str] = None,
    amenities: Optional[List[str]] = None,
    opening_hour: Optional[int] = 8,
    closing_hour: Optional[int] = 22,
    off_peak_rate: Optional[float] = None,
    generate_slots: bool = False,
) -> Venue:
    point_wkt = f"SRID=4326;POINT({lng} {lat})"
    amenities_str = ",".join(amenities) if amenities else ""
    venue = Venue(
        owner_id=owner_id,
        name=name,
        address=address,
        latitude=lat,
        longitude=lng,
        location=point_wkt,
        sports=",".join(sports),
        hourly_rate=hourly_rate,
        image_url=image_url,
        is_verified=True,
        contact_person=contact_person,
        contact_phone=contact_phone,
        surface_type=surface_type,
        amenities=amenities_str,
        opening_hour=opening_hour or 8,
        closing_hour=closing_hour or 22,
        off_peak_rate=off_peak_rate,
    )
    db.add(venue)
    await db.flush()

    # Generate initial bookable slots if requested
    if generate_slots:
        start_h = opening_hour or 8
        end_h = closing_hour or 22
        today = datetime.now(timezone.utc)
        for h in range(start_h, end_h, 2):
            s_time = today.replace(hour=h, minute=0, second=0, microsecond=0)
            e_time = today.replace(hour=min(h + 2, 23), minute=0, second=0, microsecond=0)
            is_off = h < 16
            rate = off_peak_rate if (is_off and off_peak_rate is not None) else hourly_rate
            slot = VenueSlot(
                venue_id=venue.id,
                start_time=s_time,
                end_time=e_time,
                price=rate,
                is_off_peak=is_off,
                is_booked=False,
            )
            db.add(slot)

    await db.commit()
    await db.refresh(venue)
    return venue


async def add_slot(
    db: AsyncSession,
    venue_id: str,
    start_time: datetime,
    end_time: datetime,
    price: float,
    is_off_peak: bool = False,
) -> VenueSlot:
    slot = VenueSlot(
        venue_id=venue_id,
        start_time=start_time,
        end_time=end_time,
        price=price,
        is_off_peak=is_off_peak,
        is_booked=False,
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return slot


async def reserve_slot(
    db: AsyncSession,
    venue_id: str,
    slot_id: str,
    user: User,
) -> VenueReservation:
    # Row-lock the slot to prevent double-booking
    query = (
        select(VenueSlot)
        .where(VenueSlot.id == slot_id, VenueSlot.venue_id == venue_id)
        .with_for_update()
    )
    result = await db.execute(query)
    slot = result.scalars().first()

    if not slot:
        raise ValueError("Venue slot not found")

    if slot.is_booked:
        raise ValueError("This venue slot has already been reserved")

    slot.is_booked = True

    reservation = VenueReservation(
        venue_id=venue_id,
        slot_id=slot.id,
        user_id=user.id,
        amount=slot.price,
        status="confirmed",
    )
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)

    # Load relation
    reservation.slot = slot
    return reservation
