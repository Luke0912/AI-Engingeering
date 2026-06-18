import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 2. Initialize the MCP Client
const mcpClient = new Client(
  {
    name: "AetherAI-MCP-Client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

async function run() {
  console.log("🔌 [MCP Client] Connecting to MCP Server...");

  // 3. Start the MCP Server as a background child process using STDIO pipes!
  // We point it directly to the server's index file.
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", path.resolve(__dirname, "../../mcp-server/src/index.ts")],
  });

  await mcpClient.connect(transport);
  console.log("✅ [MCP Client] Connected to Server successfully.");

  // 4. Ask the Server: "What tools do you have?"
  const { tools } = await mcpClient.listTools();
  console.log(`🛠️  [MCP Client] Discovered ${tools.length} tool(s) from server:`, tools.map(t => t.name));

  // Convert MCP Tools format into Groq/OpenAI JSON Schema format
  const groqTools = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));

  // 5. Ask Groq a question that requires the tool!
  const userPrompt = "What is the current stock price of AAPL?";
  console.log(`\n🗣️  [USER] ${userPrompt}`);

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { 
      role: "system", 
      content: "You are an AI assistant. You have access to real-time tools. When you receive a tool result, you MUST state the exact answer provided by the tool without any additional conversational filler, disclaimers, or recommendations." 
    },
    { role: "user", content: userPrompt },
  ];

  console.log("🧠 [AI] Thinking...");
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: messages,
    tools: groqTools.length > 0 ? groqTools : undefined,
    tool_choice: "auto",
  });

  const responseMessage = response.choices[0].message;

  // 6. Check if Groq wants to use a tool
  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(`⚙️  [AI] Requested to run tool: ${functionName} with args:`, functionArgs);

      // 7. Ask the MCP Server to execute the tool!
      // Notice we don't have the stock logic here in the client at all.
      const result = await mcpClient.callTool({
        name: functionName,
        arguments: functionArgs,
      });

      // MCP returns an array of content objects. We extract the text.
      const resultText = result.content.map((c: any) => c.text).join("\n");
      console.log(`📊 [SERVER RESULT] ${resultText}`);

      // 8. Give the result back to Groq
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: resultText,
      });
    }

    // 9. Groq generates the final response
    const finalResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: messages,
    });

    console.log(`\n🤖 [AI FINAL ANSWER] ${finalResponse.choices[0].message.content}`);

  } else {
    console.log(`\n🤖 [AI ANSWER] ${responseMessage.content}`);
  }

  // Close the connection
  process.exit(0);
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
