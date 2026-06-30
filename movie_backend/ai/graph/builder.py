from langgraph.prebuilt import ToolNode
from langgraph.graph import StateGraph,START,END
from movie_backend.ai.prompts.system_prompt import SYSTEM_PROMPT
from movie_backend.ai.graph.state import AgentState

from movie_backend.ai.configs.config import llm

from movie_backend.ai.tools.favorite import user_favorite_genre_count
from movie_backend.ai.tools.history import user_history_genre_count
from movie_backend.ai.tools.rag import rag

from movie_backend.ai.nodes import chat_bot
from movie_backend.ai.router import decision

tools=[user_history_genre_count,user_favorite_genre_count,rag]

llm = llm.bind_tools(tools)

graph = StateGraph(AgentState)

tool_node = ToolNode(tools)
graph.add_node("tool_node",tool_node)
graph.add_node("chat_bot",chat_bot)

graph.add_edge(START,"chat_bot")
graph.add_conditional_edges(
    "chat_bot",
    decision,
    {
        "continue": "tool_node",
        "END": END
    }
)

graph.add_edge("tool_node","chat_bot")

compiled_graph = graph.compile()