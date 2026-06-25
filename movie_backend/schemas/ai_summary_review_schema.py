from pydantic import BaseModel

class SummaryRequest(BaseModel):
    movie_id: int

class SummaryResponse(BaseModel):
    summary_message: str