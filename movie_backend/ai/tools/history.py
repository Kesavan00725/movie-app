from langchain_core.tools import tool

@tool
def user_history_genre_count():
    """
    Returns the user's watch history statistics.

    Use this tool to personalize recommendations based on
    the user's viewing behaviour, favourite genres,
    recently watched genres and watch frequency.
    """

    return {
        "Horror": 10,
        "Romance": 3,
        "War": 2,
    }