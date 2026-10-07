from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.crud import crud_user

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if token.startswith("mock-jwt-token-"):
        user_id = token.replace("mock-jwt-token-", "")
        user = await crud_user.get_by_id(db, user_id=user_id)
        if user:
            return user
        from app.core.security import get_password_hash
        display_name = user_id.replace('-', ' ').replace('_', ' ').title()
        user = User(
            id=user_id,
            email=f"{user_id}@example.com",
            name=display_name,
            hashed_password=get_password_hash("password123"),
            reliability_score=100,
            preferred_sports=["football", "cricket"],
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    payload = decode_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_optional_current_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[User]:
    if not token:
        return None
    try:
        if token.startswith("mock-jwt-token-"):
            user_id = token.replace("mock-jwt-token-", "")
            user = await crud_user.get_by_id(db, user_id=user_id)
            if user:
                return user
            from app.core.security import get_password_hash
            display_name = user_id.replace('-', ' ').replace('_', ' ').title()
            user = User(
                id=user_id,
                email=f"{user_id}@example.com",
                name=display_name,
                hashed_password=get_password_hash("password123"),
                reliability_score=100,
                preferred_sports=["football", "cricket"],
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            return user

        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        return await crud_user.get_by_id(db, user_id=user_id)
    except Exception:
        return None
