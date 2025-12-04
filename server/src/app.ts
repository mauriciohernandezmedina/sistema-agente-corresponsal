import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

// Load environment variables
dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for debugging
  credentials: true
}));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Body Parser
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
