import Groq from 'groq-sdk';
import { config } from './config.js';

async function testGroq() {
  const groq = new Groq({ apiKey: config.GROQ_API_KEY });
  console.log("Testing Groq stream API directly...");
  try {
    const stream = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello world' }],
      model: 'llama-3.1-8b-instant',
      stream: true,
    });
    console.log("Stream initiated!");
    for await (const chunk of stream) {
      process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }
    console.log("\nDone!");
  } catch (err: any) {
    console.error("Groq Error:", err.message);
  }
}
testGroq();
