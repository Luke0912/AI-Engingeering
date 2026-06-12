import { GroqService } from './groqService.js';

async function testStream() {
  const service = new GroqService();
  console.log('🤖 Starting Groq streaming integration test...');
  console.log('------------------------------------------------');

  try {
    let tokenCount = 0;
    const startTime = Date.now();

    await service.chatStream('Hello, write a short sentence.', (token) => {
      tokenCount++;
      process.stdout.write(token);
    });

    const elapsed = Date.now() - startTime;
    console.log(`\n\n✅ Stream completed successfully!`);
    console.log(`⚡ Yielded ${tokenCount} tokens in ${elapsed}ms.`);
  } catch (error) {
    console.error('\n❌ Gemini stream failed:', error);
  }
}

testStream();
