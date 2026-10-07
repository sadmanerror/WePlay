from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.venue import VenueOut, VenueSlotOut, VenueReservationOut, VenueCreate
from app.schemas.match import LatLng
from app.crud import crud_venue
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User

router = APIRouter()


def venue_to_schema(venue) -> VenueOut:
    amenities_list = []
    if getattr(venue, "amenities", None):
        if isinstance(venue.amenities, str):
            amenities_list = [a.strip() for a in venue.amenities.split(",") if a.strip()]
        elif isinstance(venue.amenities, list):
            amenities_list = venue.amenities

    return VenueOut(
        id=venue.id,
        owner_id=venue.owner_id,
        name=venue.name,
        address=venue.address,
        location=LatLng(lat=venue.latitude, lng=venue.longitude),
        sports=venue.sports.split(",") if venue.sports else [],
        image_url=venue.image_url,
        hourly_rate=venue.hourly_rate,
        rating=venue.rating,
        is_verified=venue.is_verified,
        contact_person=getattr(venue, "contact_person", None),
        contact_phone=getattr(venue, "contact_phone", None),
        surface_type=getattr(venue, "surface_type", None),
        amenities=amenities_list,
        off_peak_rate=getattr(venue, "off_peak_rate", None),
        opening_hour=getattr(venue, "opening_hour", 8),
        closing_hour=getattr(venue, "closing_hour", 22),
        created_at=venue.created_at,
        slots=[
            VenueSlotOut(
                id=s.id,
                venue_id=s.venue_id,
                start_time=s.start_time,
                end_time=s.end_time,
                price=s.price,
                is_off_peak=s.is_off_peak,
                is_booked=s.is_booked,
            )
            for s in (venue.slots or [])
        ],
    )


@router.get("/", response_model=List[VenueOut])
async def list_venues_endpoint(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius: Optional[float] = Query(None, description="Radius in km"),
    sport: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    venues = await crud_venue.list_venues(
        db,
        lat=lat,
        lng=lng,
        radius_km=radius,
        sport=sport,
    )
    return [venue_to_schema(v) for v in venues]


@router.post("/", response_model=VenueOut, status_code=status.HTTP_201_CREATED)
async def create_venue_endpoint(
    venue_in: VenueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    owner_id = current_user.id if current_user else None
    venue = await crud_venue.create_venue(
        db,
        name=venue_in.name,
        address=venue_in.address,
        lat=venue_in.location.lat,
        lng=venue_in.location.lng,
        sports=venue_in.sports,
        hourly_rate=venue_in.hourly_rate,
        owner_id=owner_id,
        image_url=venue_in.image_url,
        contact_person=venue_in.contact_person,
        contact_phone=venue_in.contact_phone,
        surface_type=venue_in.surface_type,
        amenities=venue_in.amenities,
        opening_hour=venue_in.opening_hour,
        closing_hour=venue_in.closing_hour,
        off_peak_rate=venue_in.off_peak_rate,
        generate_slots=True,
    )
    return venue_to_schema(venue)


@router.get("/{venue_id}", response_model=VenueOut)
async def get_venue_endpoint(
    venue_id: str,
    db: AsyncSession = Depends(get_db),
):
    venue = await crud_venue.get_by_id(db, venue_id=venue_id)
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")
    return venue_to_schema(venue)


@router.post("/{venue_id}/slots/{slot_id}/reserve", response_model=VenueReservationOut)
async def reserve_venue_slot_endpoint(
    venue_id: str,
    slot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        reservation = await crud_venue.reserve_slot(
            db=db,
            venue_id=venue_id,
            slot_id=slot_id,
            user=current_user,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    slot_out = VenueSlotOut(
        id=reservation.slot.id,
        venue_id=reservation.slot.venue_id,
        start_time=reservation.slot.start_time,
        end_time=reservation.slot.end_time,
        price=reservation.slot.price,
        is_off_peak=reservation.slot.is_off_peak,
        is_booked=reservation.slot.is_booked,
    )

    return VenueReservationOut(
        id=reservation.id,
        venue_id=reservation.venue_id,
        slot_id=reservation.slot_id,
        user_id=reservation.user_id,
        amount=reservation.amount,
        status=reservation.status,
        created_at=reservation.created_at,
        slot=slot_out,
    )
