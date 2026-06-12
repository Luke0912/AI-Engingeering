import express from 'express';
import { GroqService } from './groqService.js';
const app = express();
app.use(express.json());
const aiService = new GroqService();

app.post('/stream', async (req, res) => {
  console.log("Got request");
  req.socket.setTimeout(0);
  req.socket.setKeepAlive(true);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': sse connection established\n\n');
  try {
    console.log("Calling groq");
    await aiService.chatStream(req.body.prompt || "hi", (token) => {
      process.stdout.write(token);
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    });
    console.log("\nDone");
    res.write('data: [DONE]\n\n');
    res.end();
  } catch(e: any) {
    console.error("Error:", e.message);
    res.end();
  }
});
app.listen(3001, () => console.log("Listening 3001"));
