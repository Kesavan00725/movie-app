from pydantic import BaseModel

class AiResponse(BaseModel):
    movie_ids: list[int]
    explanation: str

class AiRequest(BaseModel):
    message: str

