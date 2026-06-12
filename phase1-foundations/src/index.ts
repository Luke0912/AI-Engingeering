import express, { Request, Response, NextFunction } from 'express';
import { config } from './config.js';
import { GeminiService } from './geminiService.js';

const app = express();
app.use(express.json());

const aiService = new GeminiService();

// Live health-check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Extraction routing
app.post('/api/v1/extract', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailText } = req.body;

    if (!emailText || typeof emailText !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Required field "emailText" is missing or is not a valid string.',
      });
      return;
    }

    const startTime = Date.now();
    const result = await aiService.extractEmailMetadata(emailText);
    const latencyMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      latencyMs,
      data: result,
    });
  } catch (error) {
    next(error); // Route errors to global error middleware
  }
});

// Global Express Production-grade Error Interceptor
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Global Exception Intercepted:', err.stack);
  res.status(500).json({
    success: false,
    error: 'An internal server error occurred while processing the AI extraction.',
    details: config.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(config.PORT, () => {
  console.log(`🚀 Production AI Extraction Service running in [${config.NODE_ENV}] mode on port ${config.PORT}`);
});
