# The Real-World Production Stack (What to Learn Next)

In this repository, we built everything from scratch (Raw Fetch requests, custom Vector DBs, custom while-loops for Agents) to understand the **core computer science concepts** behind AI.

In a real-world product-based company, you will transition to using established, optimized production libraries. Now that you understand the raw fundamentals, here is the exact tech stack you should learn next:

---

## 1. Production Vector Databases (Replacing our custom Vector DB)
Our custom `vectorDb.ts` computed embeddings entirely on your CPU and stored them in memory. In production with millions of documents, this would crash.
**What to learn:**
- **Pinecone:** The most popular managed SaaS Vector Database.
- **ChromaDB / Qdrant:** Popular open-source Vector Databases you can self-host.
- **pgvector:** An extension for PostgreSQL that allows you to store vector embeddings right alongside your normal relational data (highly recommended for product companies!).

## 2. Production AI Frameworks (Replacing our custom Agent loops)
Our custom `while` loops are great for learning, but managing complex memory and edge cases gets messy.
**What to learn:**
- **LangChain:** The industry standard library for gluing together prompts, tools, and models. Excellent for simple RAG pipelines.
- **LangGraph:** Created by LangChain, this is the industry standard for building the Multi-Agent State Graphs we built in Phase 5. It handles saving state to databases automatically, allowing you to pause agents and wait for human approval.
- **Vercel AI SDK:** If you build web apps in React/Next.js, this is the absolute best framework for streaming AI responses and rendering UI components dynamically (Generative UI).

## 3. Production Models & APIs (Replacing Groq)
Groq is incredible for fast, open-source inferencing, but product companies often rely on the absolute frontier models for complex reasoning.
**What to learn:**
- **OpenAI SDK (`openai`):** The standard. Learn how to use GPT-4o for complex reasoning.
- **Anthropic SDK (`@anthropic-ai/sdk`):** Claude 3.5 Sonnet is currently considered the best model in the world for coding and complex agentic tasks.
- **OpenAI Structured Outputs:** Learn how to force an AI model to strictly adhere to a JSON schema (bypassing the hallucinations we saw in Phase 4).

## 4. The Most Important Missing Piece: AI Evals
When you build standard software, you write Unit Tests (e.g., `expect(2+2).toBe(4)`). 
When you build AI software, the output is non-deterministic (it changes every time). You cannot use normal unit tests.
**What to learn:**
- **Evals (Evaluations):** The process of writing automated scripts that use an "Evaluator AI" to grade the outputs of your "Worker AI".
- **Libraries:** Learn frameworks like `Braintrust`, `LangSmith`, or `Ragas` to automatically score your AI on metrics like "Hallucination Rate", "Tone", and "Relevance".

## 5. Advanced RAG Techniques
Splitting text into 500-word chunks (like we did) is called "Naive RAG". In production, you will need to learn:
- **Semantic Routing:** Sending the user's query to different databases based on their intent.
- **Query Expansion / HyDE:** Having the AI rewrite the user's search query to get better database search results.
- **Re-ranking:** Using a specialized model (like Cohere Rerank) to perfectly sort the search results returned by the Vector DB before giving them to the LLM.
