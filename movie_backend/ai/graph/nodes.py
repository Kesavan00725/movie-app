from langchain_core.messages import SystemMessage
from movie_backend.ai.prompts.system_prompt import SYSTEM_PROMPT
from movie_backend.ai.graph.state import AgentState

from movie_backend.ai.configs.config import llm

def chat_bot(state: AgentState) -> AgentState:
    system = SystemMessage(content=SYSTEM_PROMPT)

    response = llm.invoke([system] + state["messages"])

    return {"messages": [response]}
