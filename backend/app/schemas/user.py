from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    preferred_sports: List[str] = Field(default_factory=list)
    bio: Optional[str] = ""
    description: Optional[str] = ""


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    avatar_url: Optional[str] = None
    preferred_sports: Optional[List[str]] = None
    bio: Optional[str] = None
    description: Optional[str] = None


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    avatar_url: Optional[str] = None
    avatarUrl: Optional[str] = None
    preferred_sports: List[str] = Field(default_factory=list)
    preferredSports: Optional[List[str]] = None
    reliability_score: int = 100
    reliabilityScore: Optional[int] = None
    matches_played: int = 0
    matchesPlayed: Optional[int] = None
    matches_hosted: int = 0
    matchesHosted: Optional[int] = None
    bio: Optional[str] = ""
    description: Optional[str] = ""
    followers_count: Optional[int] = 0
    followersCount: Optional[int] = 0
    following_count: Optional[int] = 0
    followingCount: Optional[int] = 0
    is_following: Optional[bool] = False
    isFollowing: Optional[bool] = False
    created_at: datetime
    createdAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    def model_post_init(self, __context):
        if not self.avatarUrl:
            self.avatarUrl = self.avatar_url
        if not self.preferredSports:
            self.preferredSports = self.preferred_sports
        if self.reliabilityScore is None:
            self.reliabilityScore = self.reliability_score
        if self.matchesPlayed is None:
            self.matchesPlayed = self.matches_played
        if self.matchesHosted is None:
            self.matchesHosted = self.matches_hosted
        if not self.description and self.bio:
            self.description = self.bio
        if not self.followersCount and self.followers_count:
            self.followersCount = self.followers_count
        if not self.followingCount and self.following_count:
            self.followingCount = self.following_count
        if self.isFollowing is None and self.is_following is not None:
            self.isFollowing = self.is_following
        if not self.createdAt:
            self.createdAt = self.created_at




class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshTokenInput(BaseModel):
    refresh_token: str
