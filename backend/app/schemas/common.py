from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    data: T
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
