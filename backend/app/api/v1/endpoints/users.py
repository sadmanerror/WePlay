from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
from app.core.database import get_db
from app.schemas.user import UserOut, UserUpdate
from app.crud import crud_user
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.follow import Follow

router = APIRouter()


async def get_user_out_with_follows(db: AsyncSession, user: User, current_user_id: Optional[str] = None) -> UserOut:
    # Count followers (people following this user)
    followers_count_q = select(func.count(Follow.id)).where(Follow.following_id == user.id)
    followers_res = await db.execute(followers_count_q)
    followers_count = followers_res.scalar() or 0

    # Count following (people this user follows)
    following_count_q = select(func.count(Follow.id)).where(Follow.follower_id == user.id)
    following_res = await db.execute(following_count_q)
    following_count = following_res.scalar() or 0

    is_following = False
    if current_user_id and current_user_id != user.id:
        check_q = select(Follow.id).where(
            and_(Follow.follower_id == current_user_id, Follow.following_id == user.id)
        )
        check_res = await db.execute(check_q)
        is_following = check_res.first() is not None

    user_out = UserOut.model_validate(user)
    user_out.followers_count = followers_count
    user_out.followersCount = followers_count
    user_out.following_count = following_count
    user_out.followingCount = following_count
    user_out.is_following = is_following
    user_out.isFollowing = is_following
    user_out.description = getattr(user, "description", "") or getattr(user, "bio", "") or ""
    return user_out


@router.get("/{user_id}", response_model=UserOut)
async def get_user_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    user = await crud_user.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return await get_user_out_with_follows(db, user, current_user.id if current_user else None)


@router.patch("/me", response_model=UserOut)
async def update_my_profile(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = user_in.model_dump(exclude_unset=True)
    if "description" in update_data and update_data["description"] is not None:
        current_user.description = update_data["description"]
        current_user.bio = update_data["description"]
    if "name" in update_data and update_data["name"] is not None:
        current_user.name = update_data["name"]
    if "preferred_sports" in update_data and update_data["preferred_sports"] is not None:
        current_user.preferred_sports = update_data["preferred_sports"]
    if "avatar_url" in update_data and update_data["avatar_url"] is not None:
        current_user.avatar_url = update_data["avatar_url"]

    await db.commit()
    await db.refresh(current_user)
    return await get_user_out_with_follows(db, current_user, current_user.id)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user_profile_by_id(
    user_id: str,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    target_user = await crud_user.get_by_id(db, user_id=user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    update_data = user_in.model_dump(exclude_unset=True)
    if "description" in update_data and update_data["description"] is not None:
        target_user.description = update_data["description"]
        target_user.bio = update_data["description"]
    if "name" in update_data and update_data["name"] is not None:
        target_user.name = update_data["name"]
    if "preferred_sports" in update_data and update_data["preferred_sports"] is not None:
        target_user.preferred_sports = update_data["preferred_sports"]
    if "avatar_url" in update_data and update_data["avatar_url"] is not None:
        target_user.avatar_url = update_data["avatar_url"]

    await db.commit()
    await db.refresh(target_user)
    return await get_user_out_with_follows(db, target_user, target_user.id)


@router.post("/{user_id}/follow")
async def toggle_follow_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself")

    target_user = await crud_user.get_by_id(db, user_id=user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if already following
    q = select(Follow).where(
        and_(Follow.follower_id == current_user.id, Follow.following_id == user_id)
    )
    res = await db.execute(q)
    existing_follow = res.scalars().first()

    if existing_follow:
        await db.delete(existing_follow)
        await db.commit()
        is_following = False
    else:
        new_follow = Follow(follower_id=current_user.id, following_id=user_id)
        db.add(new_follow)
        await db.commit()
        is_following = True

    # Get updated counts
    followers_count_q = select(func.count(Follow.id)).where(Follow.following_id == user_id)
    followers_res = await db.execute(followers_count_q)
    followers_count = followers_res.scalar() or 0

    following_count_q = select(func.count(Follow.id)).where(Follow.follower_id == user_id)
    following_res = await db.execute(following_count_q)
    following_count = following_res.scalar() or 0

    return {
        "following": is_following,
        "is_following": is_following,
        "followers_count": followers_count,
        "following_count": following_count,
    }


@router.get("/{user_id}/followers", response_model=List[UserOut])
async def get_user_followers(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    q = select(User).join(Follow, Follow.follower_id == User.id).where(Follow.following_id == user_id)
    res = await db.execute(q)
    followers = res.scalars().all()
    curr_id = current_user.id if current_user else None
    return [await get_user_out_with_follows(db, u, curr_id) for u in followers]


@router.get("/{user_id}/following", response_model=List[UserOut])
async def get_user_following(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    q = select(User).join(Follow, Follow.following_id == User.id).where(Follow.follower_id == user_id)
    res = await db.execute(q)
    following = res.scalars().all()
    curr_id = current_user.id if current_user else None
    return [await get_user_out_with_follows(db, u, curr_id) for u in following]
