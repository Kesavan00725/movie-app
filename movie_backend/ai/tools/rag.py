from langchain_core.tools import tool
from rag import vector_store

@tool
def rag(query: str):
    """
    Return top 5 Movies

    Searches the movie knowledge base using semantic search.

    Use this tool when you need movie information such as
    themes, mood, atmosphere, similar movies,
    audience suitability and semantic recommendations.
    """
    retrival = vector_store.as_retriever(search_kwargs={"k": 5})

    docs = retrival.invoke(
        query
    )

    content = ""
    for doc in docs:
        content = content + " " + doc.page_content

    return content
