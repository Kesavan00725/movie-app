from pydantic import BaseModel
from movie_backend.schemas.movie_schema import MovieResponse

class FavoriteResponse(BaseModel):
    id: int
    movie: MovieResponse

    class Config:
        from_attributes = True