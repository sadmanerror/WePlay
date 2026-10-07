from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserOut


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class MessageOut(BaseModel):
    id: str
    match_id: str
    matchId: Optional[str] = None
    user_id: str
    userId: Optional[str] = None
    content: str
    created_at: datetime
    createdAt: Optional[datetime] = None
    user: UserOut

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    def model_post_init(self, __context):
        if not self.matchId:
            self.matchId = self.match_id
        if not self.userId:
            self.userId = self.user_id
        if not self.createdAt:
            self.createdAt = self.created_at
