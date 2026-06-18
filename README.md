# Foundations of AI Engineering

This repository contains a from-scratch, foundational curriculum for modern AI Engineering. Instead of relying on "magic" heavy-weight libraries like LangChain or LlamaIndex, this project builds the core pillars of the AI ecosystem from the ground up using plain TypeScript and the Groq API.

## 📚 Curriculum Overview

### Phase 1: API Streaming & Memory (`/phase1-foundations`)
- **What we built:** A live, streaming chat application connected to the Groq API.
- **Concepts Learned:** Server-Sent Events (SSE), API integration, and managing conversational state by maintaining a rolling array of user/assistant message objects.
- **Real-World Use Case:** Standard customer support chatbots and conversational interfaces.

### Phase 2: RAG & Vector Databases (`/phase3-advanced/src/vectorDb.ts`)
- **What we built:** A local Vector Database from absolute scratch using HuggingFace Transformers. We generated numerical embeddings for private text files and performed Cosine Similarity searches.
- **Concepts Learned:** Retrieval-Augmented Generation (RAG), Token Embeddings, Semantic Search, and Context Injection.
- **Real-World Use Case:** Enterprise search. Allowing an AI to answer questions based on private, proprietary company documents (like HR manuals or financial records) without training a custom model.

### Phase 3: Tool Calling & AI Agents (`/phase3-advanced/src/agentService.ts`)
- **What we built:** A ReAct (Reasoning + Acting) Agent loop. We gave the AI JSON schemas describing local Node.js functions (like a math calculator), allowing the AI to request function executions dynamically.
- **Concepts Learned:** LLM Tool Calling, JSON Schemas, Agent Loops, and intercepting AI requests to execute code.
- **Real-World Use Case:** Giving AI "hands". Used by companies to allow AI to book flights, check live weather, query SQL databases, or execute terminal commands automatically.

### Phase 4: Model Context Protocol (MCP) (`/phase4-mcp`)
- **What we built:** A standardized MCP Server that exposes tools over STDIO, and an MCP Client that automatically discovers those tools and connects them to the AI.
- **Concepts Learned:** Anthropic's MCP Standard, dynamic tool discovery, and separating tool execution logic from AI routing logic.
- **Real-World Use Case:** The future of AI integrations. Used by products like Claude Desktop and Cursor to securely connect to external databases, GitHub repos, and local file systems without hardcoding APIs.

### Phase 5: Multi-Agent Systems & State Graphs (`/phase5-multi-agent`)
- **What we built:** A from-scratch implementation of a State Graph (the core concept behind LangGraph). We built a team of specialized AI agents (Researcher, Writer, Reviewer) that pass a shared state object in a loop until a condition is met.
- **Concepts Learned:** State Machines, Multi-Agent Collaboration, Conditional Routing, and breaking complex prompts into specialized narrow tasks.
- **Real-World Use Case:** Automated software engineering (e.g., Devin), complex legal auditing, or any enterprise workflow where tasks must be broken down, drafted, reviewed, and iterated upon automatically.

---

## 🏢 Why Product Companies Build This Way
If you ask one AI model a massive prompt like *"Write a 50-page technical manual"*, it will fail, hallucinate, or lose context. Product-based companies solve this by breaking massive problems into deterministic systems:
1. They use **RAG** to ground the AI in factual data so it doesn't hallucinate.
2. They use **Tools/MCP** to connect the AI to the live internet or private databases.
3. They use **Multi-Agent Systems** to break massive tasks into tiny pieces handled by narrowly-focused "Specialist AIs" (e.g., a Writer AI + a QA/Reviewer AI).
