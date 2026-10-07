import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    preferred_sports = Column(JSON, nullable=False, default=list)  # array of sport IDs
    reliability_score = Column(Integer, nullable=False, default=100)  # 0 - 100
    matches_played = Column(Integer, nullable=False, default=0)
    matches_hosted = Column(Integer, nullable=False, default=0)
    bio = Column(Text, nullable=True, default="")
    description = Column(Text, nullable=True, default="")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    hosted_matches = relationship("Match", back_populates="host", cascade="all, delete-orphan")
    participations = relationship("MatchParticipant", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
