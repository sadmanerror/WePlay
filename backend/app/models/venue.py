import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography
from app.models.base import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(250), nullable=False)

    location = Column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False).with_variant(String, "sqlite"),
        nullable=True
    )
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    sports = Column(String(200), nullable=False, default="football,cricket") # comma separated
    image_url = Column(String(500), nullable=True)
    hourly_rate = Column(Float, nullable=False, default=1200.0)
    rating = Column(Float, nullable=False, default=4.8)
    is_verified = Column(Boolean, nullable=False, default=True)
    contact_person = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    surface_type = Column(String(50), nullable=True)
    amenities = Column(String(300), nullable=True)
    off_peak_rate = Column(Float, nullable=True)
    opening_hour = Column(Integer, nullable=True, default=8)
    closing_hour = Column(Integer, nullable=True, default=22)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    slots = relationship("VenueSlot", back_populates="venue", cascade="all, delete-orphan", order_by="VenueSlot.start_time")
    owner = relationship("User")


class VenueSlot(Base):
    __tablename__ = "venue_slots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    venue_id = Column(String(36), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    price = Column(Float, nullable=False)
    is_off_peak = Column(Boolean, nullable=False, default=False)
    is_booked = Column(Boolean, nullable=False, default=False)

    venue = relationship("Venue", back_populates="slots")


class VenueReservation(Base):
    __tablename__ = "venue_reservations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    venue_id = Column(String(36), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_id = Column(String(36), ForeignKey("venue_slots.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="confirmed") # confirmed, cancelled
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    venue = relationship("Venue")
    slot = relationship("VenueSlot")
    user = relationship("User")
