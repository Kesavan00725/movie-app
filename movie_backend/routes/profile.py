from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from movie_backend.database.database import get_db
from movie_backend.util.helpers import verify_token

from movie_backend.schemas.Profile_schema import (
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse
)

from movie_backend.schemas.response_schema import (
    MessageResponse
)

from movie_backend.services.profile_service import (
    create_profile_service,
    get_profile_service,
    update_profile_service,
    delete_profile_service
)

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.post(
    "/",
    response_model=ProfileResponse,
    status_code=201
)
async def create_profile(
    data: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await create_profile_service(
        data,
        db,
        current_user
    )


@router.get(
    "/",
    response_model=ProfileResponse
)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await get_profile_service(
        db,
        current_user
    )


@router.patch(
    "/",
    response_model=ProfileResponse
)
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await update_profile_service(
        data,
        db,
        current_user
    )


@router.delete(
    "/",
    response_model=MessageResponse
)
async def delete_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(verify_token)
):
    return await delete_profile_service(
        db,
        current_user
    )