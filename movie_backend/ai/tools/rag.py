from langchain_core.tools import tool

from movie_backend.ai.vectorstore.store import vector_store

retriever = vector_store.as_retriever(
    search_kwargs={"k": 5}
)


@tool
def rag(query: str):
    """
    Returns the top 5 most relevant movies from the vector database.

    Use this tool whenever movie knowledge, themes, genres,
    descriptions, atmosphere or semantic similarity is required.
    """

    docs = retriever.invoke(query)

    return "\n\n".join(
        doc.page_content
        for doc in docs
    )