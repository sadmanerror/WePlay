import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base


class MatchParticipant(Base):
    __tablename__ = "match_participants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = Column(String(36), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False, default="player")  # player | spectator
    status = Column(String(20), nullable=False, default="confirmed")  # confirmed | cancelled | attended | no_show
    joined_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    match = relationship("Match", back_populates="participants")
    user = relationship("User", back_populates="participations")

    __table_args__ = (
        UniqueConstraint("match_id", "user_id", name="uq_match_user"),
    )
