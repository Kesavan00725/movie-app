from fastapi import APIRouter,Depends
from sqlalchemy.ext.asyncio import AsyncSession
from movie_backend.database.database import get_db
from movie_backend.util.helpers import verify_token

from movie_backend.schemas.ai_recommendation import (
    AiResponse,
    AiRequest
)

from movie_backend.services.ai_recommendation_service import get_ai_recommendation

router = APIRouter(
    prefix="/ai_recommendation",
    tags=["Ai_Recommendation"]
)

@router.post("/",response_model=AiResponse)
async def ai_recommendation(
        request: AiRequest,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(verify_token)
):
    return await get_ai_recommendation(request,db, current_user)


