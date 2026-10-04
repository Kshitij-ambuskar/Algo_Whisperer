import os
from typing import Annotated, TypedDict, List
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, AIMessage
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

load_dotenv()

app = FastAPI(title="Socratic Algorithmic Mentor")

# Allow React app origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

hf_endpoint = HuggingFaceEndpoint(
    repo_id="Qwen/Qwen2.5-Coder-7B-Instruct", 
    task="text-generation",
    max_new_tokens=250,
    temperature=0.2,
    huggingfacehub_api_token=os.environ.get("HUGGINGFACEHUB_API_TOKEN")
)

llm = ChatHuggingFace(llm=hf_endpoint)

# ----------------- LangGraph Workflow -----------------
class TutorState(TypedDict):
    problem_description: str
    user_code: str
    messages: Annotated[list[AnyMessage], add_messages]

def tutor_node(state: TutorState):
    # Combine the system rules, problem, and code into a single string
    prompt_text = (
        "You are an expert Socratic tutor for algorithmic problem solving.\n"
        "1. NEVER output working code.\n"
        "2. Limit each response to 2-3 short, guiding sentences.\n\n"
        f"Problem Statement:\n{state['problem_description']}\n\n"
        f"User Code:\n{state['user_code']}\n\n"
        "Please address the user's latest message based on these rules."
    )
    
    # Prepend this context as a HumanMessage instead of a SystemMessage
    conversation = [HumanMessage(content=prompt_text)] + state["messages"]
    
    response = llm.invoke(conversation)
    return {"messages": [response]}

builder = StateGraph(TutorState)
builder.add_node("tutor", tutor_node)
builder.add_edge(START, "tutor")
builder.add_edge("tutor", END)
graph = builder.compile()

# ----------------- API Endpoints -----------------
class MessagePayload(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    problem_description: str
    user_code: str
    messages: List[MessagePayload]

@app.post("/api/chat")
async def chat_with_mentor(payload: ChatRequest):
    # Convert incoming JSON history into LangChain message objects
    formatted_messages: list[AnyMessage] = []
    for msg in payload.messages:
        if msg.role == "user":
            formatted_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            formatted_messages.append(AIMessage(content=msg.content))

    initial_state: TutorState = {
        "problem_description": payload.problem_description,
        "user_code": payload.user_code,
        "messages": formatted_messages,
    }

    # Run LangGraph pipeline
    output = graph.invoke(initial_state)
    latest_message = output["messages"][-1]

    return {
        "reply": latest_message.content
    }