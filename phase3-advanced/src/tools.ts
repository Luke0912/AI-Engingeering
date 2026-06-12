import Groq from 'groq-sdk';

// ==========================================
// 1. REAL NODE.JS FUNCTIONS
// ==========================================

export function calculateMath(expression: string): string {
  try {
    console.log(`\n⚙️ [TOOL EXECUTED] calculateMath called with: ${expression}`);
    // DO NOT USE eval in production without sanitization. 
    // Using simple Function constructor for educational purposes.
    const result = new Function(`return ${expression}`)();
    console.log(`✅ [TOOL RESULT] Math evaluated to: ${result}`);
    return String(result);
  } catch (error: any) {
    console.error(`❌ [TOOL ERROR] Failed to calculate math: ${error.message}`);
    return `Error evaluating expression: ${error.message}`;
  }
}

export function getCurrentTime(timezone: string): string {
  console.log(`\n⚙️ [TOOL EXECUTED] getCurrentTime called with timezone: ${timezone}`);
  try {
    const time = new Date().toLocaleString('en-US', { timeZone: timezone });
    console.log(`✅ [TOOL RESULT] Time is: ${time}`);
    return time;
  } catch (error) {
    // Fallback if timezone is invalid
    return new Date().toISOString();
  }
}

// ==========================================
// 2. JSON SCHEMAS FOR GROQ
// ==========================================

// We must explicitly tell the LLM exactly what our tools do and what arguments they require.
export const agentTools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'calculate_math',
      description: 'Evaluates a mathematical expression. Use this whenever the user asks to calculate, add, multiply, or do any math. Do NOT try to do math in your head.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'A valid javascript mathematical expression (e.g., "7892 * 4321", "100 / 4").',
          },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Gets the exact current real-world time in a specific timezone.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'The timezone to get the time for (e.g., "America/New_York", "Europe/London", "Asia/Kolkata").',
          },
        },
        required: ['timezone'],
      },
    },
  }
];
