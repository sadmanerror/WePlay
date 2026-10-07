from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.sport import Sport
from app.schemas.sport import SportOut

router = APIRouter()


@router.get("/", response_model=List[SportOut])
async def list_sports(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Sport).order_by(Sport.id.asc()))
    sports = result.scalars().all()
    return [SportOut.model_validate(s) for s in sports]
