from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserOut


class LatLng(BaseModel):
    lat: float
    lng: float


class MatchParticipantOut(BaseModel):
    id: str
    user_id: str
    userId: Optional[str] = None
    role: str
    status: str
    joined_at: datetime
    joinedAt: Optional[datetime] = None
    user: UserOut

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    def model_post_init(self, __context):
        if not self.userId:
            self.userId = self.user_id
        if not self.joinedAt:
            self.joinedAt = self.joined_at


class MatchBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    sport_id: str = Field(..., alias="sportId")
    venue_name: str = Field(..., alias="venueName")
    location: LatLng
    date: datetime
    duration_minutes: int = Field(90, alias="durationMinutes", ge=30, le=360)
    max_players: int = Field(..., alias="maxPlayers", ge=2, le=50)
    max_spectators: Optional[int] = Field(None, alias="maxSpectators")
    entry_fee: Optional[float] = Field(0.0, alias="entryFee")
    min_reliability: Optional[int] = Field(0, alias="minReliability", ge=0, le=100)
    is_tournament: Optional[bool] = Field(False, alias="isTournament")
    tournament_name: Optional[str] = Field(None, alias="tournamentName")
    description: str = Field("", max_length=2000)
    organized_by: Optional[str] = Field(None, alias="organizedBy")
    contact_details: Optional[str] = Field(None, alias="contactDetails")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class MatchCreate(MatchBase):
    pass


class MatchUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    venue_name: Optional[str] = Field(None, alias="venueName")
    location: Optional[LatLng] = None
    date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, alias="durationMinutes", ge=30, le=360)
    max_players: Optional[int] = Field(None, alias="maxPlayers", ge=2, le=50)
    max_spectators: Optional[int] = Field(None, alias="maxSpectators")
    entry_fee: Optional[float] = Field(None, alias="entryFee")
    min_reliability: Optional[int] = Field(None, alias="minReliability", ge=0, le=100)
    is_tournament: Optional[bool] = Field(None, alias="isTournament")
    tournament_name: Optional[str] = Field(None, alias="tournamentName")
    organized_by: Optional[str] = Field(None, alias="organizedBy")
    contact_details: Optional[str] = Field(None, alias="contactDetails")
    description: Optional[str] = None
    status: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class MatchOut(BaseModel):
    id: str
    host_id: str
    hostId: Optional[str] = None
    sport_id: str
    sportId: Optional[str] = None
    title: str
    venue_name: str
    venueName: Optional[str] = None
    location: LatLng
    date: datetime
    duration_minutes: int
    durationMinutes: Optional[int] = None
    max_players: int
    maxPlayers: Optional[int] = None
    current_players: int
    currentPlayers: Optional[int] = None
    max_spectators: Optional[int] = None
    maxSpectators: Optional[int] = None
    current_spectators: int
    currentSpectators: Optional[int] = None
    entry_fee: Optional[float] = 0.0
    entryFee: Optional[float] = 0.0
    min_reliability: int = 0
    minReliability: Optional[int] = 0
    is_tournament: bool = False
    isTournament: Optional[bool] = False
    tournament_name: Optional[str] = None
    tournamentName: Optional[str] = None
    organized_by: Optional[str] = None
    organizedBy: Optional[str] = None
    contact_details: Optional[str] = None
    contactDetails: Optional[str] = None
    description: str
    status: str
    is_ended: bool = False
    isEnded: Optional[bool] = False
    created_at: datetime
    createdAt: Optional[datetime] = None
    distance: Optional[float] = None
    host: Optional[UserOut] = None
    participants: Optional[List[MatchParticipantOut]] = []

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    def model_post_init(self, __context):
        if not self.hostId:
            self.hostId = self.host_id
        if not self.sportId:
            self.sportId = self.sport_id
        if not self.venueName:
            self.venueName = self.venue_name
        if not self.durationMinutes:
            self.durationMinutes = self.duration_minutes
        if not self.maxPlayers:
            self.maxPlayers = self.max_players
        if not self.currentPlayers:
            self.currentPlayers = self.current_players
        if not self.maxSpectators and self.max_spectators is not None:
            self.maxSpectators = self.max_spectators
        if not self.currentSpectators:
            self.currentSpectators = self.current_spectators
        if not self.entryFee and self.entry_fee is not None:
            self.entryFee = self.entry_fee
        if self.min_reliability is not None and not self.minReliability:
            self.minReliability = self.min_reliability
        if self.is_tournament is not None and not self.isTournament:
            self.isTournament = self.is_tournament
        if not self.tournamentName and self.tournament_name:
            self.tournamentName = self.tournament_name
        if not self.organizedBy and self.organized_by:
            self.organizedBy = self.organized_by
        if not self.contactDetails and self.contact_details:
            self.contactDetails = self.contact_details
        if not self.isEnded:
            self.isEnded = self.is_ended
        if not self.createdAt:
            self.createdAt = self.created_at



class RSVPInput(BaseModel):
    role: str = Field("player", pattern="^(player|spectator)$")
    username: Optional[str] = None


class AttendanceItem(BaseModel):
    user_id: str = Field(..., alias="userId")
    status: str = Field(..., pattern="^(attended|no_show)$")

    model_config = ConfigDict(populate_by_name=True)


class AttendanceSubmit(BaseModel):
    attendance: List[AttendanceItem]
