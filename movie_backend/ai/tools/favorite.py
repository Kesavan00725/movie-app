from langchain_core.tools import tool


@tool
def user_favorite_genre_count():
    """
    Returns the user's favourite movies and favourite genre statistics.

    Use this tool whenever recommendations should be influenced
    by the user's favourites.
    """
    return {
        "Horror": 13,
        "Romance": 1
    }