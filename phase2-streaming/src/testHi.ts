import { GeminiService } from './geminiService.js';
async function test() {
  const service = new GeminiService();
  await service.chatStream('hi', (token) => process.stdout.write(token));
}
test();
