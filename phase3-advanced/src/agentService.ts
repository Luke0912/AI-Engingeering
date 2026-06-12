import Groq from 'groq-sdk';
import { config } from './config.js';
import { agentTools, calculateMath, getCurrentTime } from './tools.js';

export class AgentService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: config.GROQ_API_KEY });
  }

  /**
   * Executes a prompt using an autonomous agent loop capable of tool calling.
   * This is NOT streamed, to make the tool calling loop easy to understand.
   */
  async runAgent(prompt: string): Promise<string> {
    console.log(`\n🤖 [AGENT] Starting agent loop for prompt: "${prompt}"`);
    
    // We maintain a history array for this specific agent run
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are an autonomous AI Agent. You have access to tools. If you need to do math or get the time, YOU MUST USE THE TOOLS. Do not guess.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Limit the loop to prevent infinite tool loops (hallucinations)
    const MAX_LOOPS = 5;
    
    for (let loopCount = 0; loopCount < MAX_LOOPS; loopCount++) {
      console.log(`⏳ [AGENT] Calling Groq API (Loop ${loopCount + 1})...`);
      
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        tools: agentTools, // <--- We attach our tools schema here!
        tool_choice: 'auto' // Let the LLM decide if it needs a tool or just normal text
      });

      const responseMessage = response.choices[0].message;

      // Check if the AI decided to call a tool
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        console.log(`🛠️ [AGENT] AI requested to use a tool!`);
        
        // We MUST append the AI's tool call request to the history so it remembers what it asked for
        messages.push(responseMessage);

        // Execute each requested tool
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          let functionResult = '';

          // 1. Run the actual TypeScript code
          if (functionName === 'calculate_math') {
            functionResult = calculateMath(functionArgs.expression);
          } else if (functionName === 'get_current_time') {
            functionResult = getCurrentTime(functionArgs.timezone);
          } else {
            functionResult = `Error: Unknown function ${functionName}`;
          }

          // 2. Append the real-world result back to the messages array!
          // We use the special role 'tool' to indicate this is the answer to its previous request.
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: functionResult
          });
        }
        
        // The loop continues! It will send the history (with the tool result) BACK to Groq.
        
      } else {
        // If there are no tool calls, it means the AI generated the final human-readable answer!
        console.log(`✅ [AGENT] Final answer generated.`);
        return responseMessage.content || "No content returned.";
      }
    }

    return "Agent aborted: Reached maximum loop iterations.";
  }
}

export const agentService = new AgentService();
