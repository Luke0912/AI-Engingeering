import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.1-8b-instant";

// 1. The "Whiteboard" (State)
// This is passed between all agents.
interface AppState {
  topic: string;
  researchNotes?: string;
  draftArticle?: string;
  feedback?: string;
  status: "RESEARCHING" | "WRITING" | "REVIEWING" | "APPROVED" | "FAILED";
  iteration: number;
}

// 2. The Researcher Agent
// Job: Gather facts and bullet points about the topic.
async function runResearcher(state: AppState): Promise<AppState> {
  console.log(`\n🔍 [RESEARCHER] Gathering facts on: "${state.topic}"...`);
  
  let prompt = `You are an expert researcher. Gather 3 key facts about the topic: "${state.topic}".`;
  
  // If the reviewer gave feedback, the researcher needs to look deeper!
  if (state.feedback) {
    prompt += `\n\nThe Reviewer rejected the last draft with this feedback: "${state.feedback}". Please find new or better facts to address this!`;
  }

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
  });

  const notes = response.choices[0].message.content || "";
  
  return {
    ...state,
    researchNotes: notes,
    status: "WRITING" // Pass to the Writer next
  };
}

// 3. The Writer Agent
// Job: Take the research notes and write a compelling article.
async function runWriter(state: AppState): Promise<AppState> {
  console.log(`\n✍️  [WRITER] Drafting article based on research...`);
  
  const prompt = `You are an expert blog writer. Write a short, engaging 2-paragraph article about "${state.topic}" using ONLY these research notes:\n\n${state.researchNotes}`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
  });

  const draft = response.choices[0].message.content || "";
  
  return {
    ...state,
    draftArticle: draft,
    status: "REVIEWING" // Pass to the Reviewer next
  };
}

// 4. The Reviewer Agent (The Boss)
// Job: Read the draft and decide if it's good enough.
async function runReviewer(state: AppState): Promise<AppState> {
  console.log(`\n🧐 [REVIEWER] Critiquing the draft...`);
  
  const prompt = `You are a strict editor. Review this draft about "${state.topic}":
  
  Draft:
  ${state.draftArticle}
  
  Does this draft sound engaging and accurate? 
  Output your response in strictly JSON format like this:
  {
    "isApproved": boolean,
    "feedback": "string explaining why it is bad, or 'Looks good!' if approved"
  }`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" } // Force the model to output valid JSON
  });

  try {
    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    if (result.isApproved) {
      console.log("✅ [REVIEWER] Approved!");
      return { ...state, feedback: result.feedback, status: "APPROVED" };
    } else {
      console.log(`❌ [REVIEWER] Rejected: ${result.feedback}`);
      return { ...state, feedback: result.feedback, status: "RESEARCHING" }; // Send back to the Researcher!
    }
  } catch (error) {
    console.log("⚠️ [REVIEWER] Failed to parse JSON, rejecting to be safe.");
    return { ...state, feedback: "Formatting error", status: "RESEARCHING" };
  }
}

// 5. The Multi-Agent Loop (State Machine)
async function runMultiAgentSystem() {
  console.log("🚀 Starting Multi-Agent Team...");
  
  let state: AppState = {
    topic: "The Invention of the Transistor",
    status: "RESEARCHING",
    iteration: 0
  };

  const MAX_ITERATIONS = 3;

  // The Whiteboard gets passed around until the Reviewer approves it
  while (state.status !== "APPROVED" && state.status !== "FAILED") {
    state.iteration++;
    console.log(`\n--- Iteration ${state.iteration} ---`);
    
    if (state.iteration > MAX_ITERATIONS) {
      console.log("\n🛑 [SYSTEM] Max iterations reached. The team is stuck in a loop!");
      state.status = "FAILED";
      break;
    }

    if (state.status === "RESEARCHING") {
      state = await runResearcher(state);
    } else if (state.status === "WRITING") {
      state = await runWriter(state);
    } else if (state.status === "REVIEWING") {
      state = await runReviewer(state);
    }
  }

  if (state.status === "APPROVED") {
    console.log(`\n🎉 [FINAL PUBLISHED ARTICLE]\n\n${state.draftArticle}`);
  }
}

// Start the app
runMultiAgentSystem().catch(console.error);
