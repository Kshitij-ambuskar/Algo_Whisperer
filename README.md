# Socratic Algorithmic Mentor

An AI-powered debugging assistant built for competitive programmers. Standard LLMs ruin the learning process by immediately outputting the full correct code when asked for help. This tool solves that problem by acting as a strict Socratic tutor. It analyzes your buggy C++ or Python code and provides targeted, conceptual hints to help you find the solution yourself.

Built with an open-source AI stack for Hacktoberfest 2026.

## Features
* **Strict Guardrails:** The agent is engineered to never write the final solution, focusing entirely on edge cases, base conditions, and time complexity flaws.
* **Open-Weight AI:** Uses LangGraph to orchestrate open-weight models (like Qwen 2.5 Coder via Hugging Face), keeping the development process open and cost-free.
* **Split-Pane IDE Interface:** A modern, dark-mode React interface featuring a dedicated code editor and a conversational AI terminal.

## Tech Stack
* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** FastAPI, Python
* **AI Orchestration:** LangGraph, LangChain, Hugging Face Inference API

## Getting Started

Follow these steps to run the application on your local machine.

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* A free Hugging Face Access Token

### 1. Backend Setup
Navigate to the backend directory and install the required Python packages:
```bash
cd backend
pip install fastapi uvicorn langgraph langchain-huggingface python-dotenv pydantic
