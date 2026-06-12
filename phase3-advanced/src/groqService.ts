import Groq from 'groq-sdk';
import { config } from './config.js';
import { vectorDb } from './vectorDb.js';

/**
 * Service to orchestrate interactions with the Groq API.
 * Uses Server-Sent Events (SSE) via the Groq SDK.
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GroqService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: config.GROQ_API_KEY });
  }

  /**
   * Establishes a real-time token stream from Groq (Llama-3.1).
   * @param messages Array of previous conversation messages.
   * @param onToken Callback executed for each chunk of text yielded by the model.
   */
  async chatStream(messages: ChatMessage[], onToken: (token: string) => void): Promise<void> {
    try {
      console.log('🟢 [GROQ] Initiating API request...');
      
      // Get the latest user query to perform Vector Search
      const latestMessage = messages[messages.length - 1]?.content || "";
      
      // Perform Cosine Similarity Search
      const relevantChunks = await vectorDb.search(latestMessage, 2);
      
      // Construct context string
      let contextInjection = "";
      if (relevantChunks.length > 0) {
        contextInjection = `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n` + relevantChunks.map(c => `- ${c.text}`).join('\n');
      }

      // We explicitly inject our system prompt at the beginning of the history
      const fullMessages = [
        {
          role: 'system',
          content: 'You are AetherAI, an elite software engineering assistant. Provide direct, highly detailed, technically accurate answers with clean markdown structures.' + contextInjection
        },
        ...messages
      ] as any[];

      const stream = await this.groq.chat.completions.create({
        messages: fullMessages,
        model: 'llama-3.1-8b-instant', // Extremely fast and capable
        stream: true,
      });

      // Consume the async generator stream
      for await (const chunk of stream) {
        const chunkText = chunk.choices[0]?.delta?.content || '';
        if (chunkText) {
          onToken(chunkText);
        }
      }
    } catch (error: any) {
      console.error('❌ Error executing Groq chat stream:', error);
      throw error;
    }
  }
}
