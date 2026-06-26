from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from movie_backend.models.profile import Profile
from movie_backend.schemas.Profile_schema import ProfileCreate, ProfileUpdate


async def create_profile_service(
    data: ProfileCreate,
    db: AsyncSession,
    current_user
):
    result = await db.execute(
        select(Profile).where(
            Profile.user_id == current_user["id"]
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists for this user"
        )

    profile = Profile(
        user_id=current_user["id"],
        preferred_language=data.preferred_language,
        favorite_movie=data.favorite_movie,
        profile_picture=data.profile_picture
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def get_profile_service(
    db: AsyncSession,
    current_user
):
    result = await db.execute(
        select(Profile).where(
            Profile.user_id == current_user["id"]
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile


async def update_profile_service(
    data: ProfileUpdate,
    db: AsyncSession,
    current_user
):
    result = await db.execute(
        select(Profile).where(
            Profile.user_id == current_user["id"]
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


async def delete_profile_service(
    db: AsyncSession,
    current_user
):
    result = await db.execute(
        select(Profile).where(
            Profile.user_id == current_user["id"]
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    await db.delete(profile)
    await db.commit()
    return {"message": "Profile deleted successfully"}