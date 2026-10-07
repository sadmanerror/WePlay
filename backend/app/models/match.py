import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Numeric, Index, Boolean
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography
from app.models.base import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    host_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sport_id = Column(String(32), ForeignKey("sports.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    venue_name = Column(String(200), nullable=False)
    
    # PostGIS spatial column for ST_DWithin queries (Point: longitude, latitude)
    location = Column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False).with_variant(String, "sqlite"),
        nullable=True
    )
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    date = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False, default=90)
    max_players = Column(Integer, nullable=False, default=10)
    current_players = Column(Integer, nullable=False, default=1)
    max_spectators = Column(Integer, nullable=True)
    current_spectators = Column(Integer, nullable=False, default=0)
    entry_fee = Column(Float, nullable=True, default=0.0)
    min_reliability = Column(Integer, nullable=False, default=0) # Karma threshold (0-100)
    is_tournament = Column(Boolean, nullable=False, default=False, index=True) # Phase 3: verified community tournament
    tournament_name = Column(String(100), nullable=True)
    organized_by = Column(String(100), nullable=True)
    contact_details = Column(String(200), nullable=True)
    description = Column(Text, nullable=False, default="")
    status = Column(String(20), nullable=False, default="open", index=True) # open, full, cancelled, completed, in_progress
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


    @property
    def is_ended(self) -> bool:
        from datetime import timedelta
        if not self.date:
            return False
        end_time = self.date + timedelta(minutes=self.duration_minutes)
        if self.date.tzinfo is not None:
            now = datetime.now(timezone.utc)
        else:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
        return now > end_time

    host = relationship("User", back_populates="hosted_matches")
    sport = relationship("Sport", back_populates="matches")
    participants = relationship("MatchParticipant", back_populates="match", cascade="all, delete-orphan", order_by="MatchParticipant.joined_at")
    messages = relationship("Message", back_populates="match", cascade="all, delete-orphan", order_by="Message.created_at")

    __table_args__ = (
        Index("idx_matches_status_date", "status", "date"),
    )
