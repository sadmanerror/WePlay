from pydantic import BaseModel, ConfigDict


class SportOut(BaseModel):
    id: str
    name: str
    emoji: str
    color: str

    model_config = ConfigDict(from_attributes=True)
