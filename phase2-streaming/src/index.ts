import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { GroqService } from './groqService.js';
import { tokenBucketRateLimiter } from './rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve the React visualizer directly from public folder
app.use(express.static(path.join(__dirname, '../public')));

const aiService = new GroqService();

// ============================================================
// DIAGNOSTIC: Simple test SSE endpoint (no Gemini, no rate limiter)
// This endpoint proves whether Express SSE streaming works at all
// ============================================================
app.post('/api/v1/chat/test', async (req: Request, res: Response): Promise<void> => {
  console.log('🧪 TEST endpoint hit');
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  
  const words = ['Hello', ' from', ' AetherAI!', ' Streaming', ' is', ' working', ' perfectly!'];
  
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ token: word })}\n\n`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  res.write('data: [DONE]\n\n');
  res.end();
  console.log('🧪 TEST endpoint completed successfully');
});

// ============================================================
// PRODUCTION: SSE Chat Streaming Endpoint
// ============================================================
app.post('/api/v1/chat/stream', tokenBucketRateLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { prompt } = req.body;

  console.log(`📥 [STEP 1] Received stream request with prompt: "${prompt}"`);

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Required field "prompt" is missing or is not a valid string.',
    });
    return;
  }

  // Track connection state
  let isConnectionClosed = false;
  let isStreamFinished = false;

  req.on('aborted', () => {
    isConnectionClosed = true;
    if (!isStreamFinished) {
      console.log('🔌 [DISCONNECT] Client aborted request prematurely. Safely halting stream rendering.');
    }
  });

  res.on('close', () => {
    isConnectionClosed = true;
  });

  // Step 2: Write SSE headers
  console.log('📤 [STEP 2] Writing SSE headers...');
  
  // Default socket timeouts are fine for Groq.

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  console.log('📤 [STEP 2] Headers flushed. Connection alive:', !isConnectionClosed);

  // Step 3: Send keep-alive
  res.write(': sse connection established\n\n');
  console.log('📤 [STEP 3] Keep-alive sent. Connection alive:', !isConnectionClosed);

  if (isConnectionClosed) {
    console.log('❌ [STEP 3] Connection already dead before Gemini call!');
    return;
  }

  try {
    let tokenCount = 0;
    const startTime = Date.now();

    // Step 4: Start Gemini stream
    console.log('🤖 [STEP 4] Starting Gemini stream...');
    
    await aiService.chatStream(prompt, (token) => {
      if (isConnectionClosed) return;

      tokenCount++;
      if (tokenCount === 1) {
        console.log(`⚡ [STEP 5] First token received in ${Date.now() - startTime}ms`);
      }
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    });

    if (!isConnectionClosed) {
      isStreamFinished = true;
      const durationMs = Date.now() - startTime;
      console.log(`✅ [DONE] Stream completed. ${tokenCount} tokens in ${durationMs}ms.`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error) {
    console.error('🔥 [ERROR] Stream transmission error:', error);
    if (!isConnectionClosed) {
      res.write(`data: ${JSON.stringify({ error: 'A stream processing error occurred.' })}\n\n`);
      res.end();
    }
  }
});

// Production Global Error Handler Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Global Exception Intercepted:', err.stack);
  res.status(500).json({
    success: false,
    error: 'An internal server error occurred.',
    details: config.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(config.PORT, () => {
  console.log(`🚀 Streaming AI Server running in [${config.NODE_ENV}] mode on port ${config.PORT}`);
  console.log(`👉 Open http://localhost:${config.PORT} in your browser`);
  console.log(`🧪 To test SSE without Gemini, run: curl -X POST http://localhost:${config.PORT}/api/v1/chat/test -H "Content-Type: application/json" -d '{"prompt":"hi"}'`);
});