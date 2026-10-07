from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.models.base import Base


class Sport(Base):
    __tablename__ = "sports"

    id = Column(String(32), primary_key=True)  # cricket, football, basketball, badminton
    name = Column(String(50), nullable=False)
    emoji = Column(String(10), nullable=False)
    color = Column(String(20), nullable=False, default="#10b981")

    matches = relationship("Match", back_populates="sport")
