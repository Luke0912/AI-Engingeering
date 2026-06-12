import { GroqService } from './groqService.js';
async function test() {
  console.log("Testing GroqService directly...");
  const s = new GroqService();
  try {
    let count = 0;
    await s.chatStream("Hello", (t) => {
      process.stdout.write(t);
      count++;
    });
    console.log("\nFinished yielding " + count + " tokens.");
  } catch(e: any) {
    console.log("Error:", e.message);
  }
}
test();
