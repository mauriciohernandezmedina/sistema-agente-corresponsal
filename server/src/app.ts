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
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Default Vite port
  credentials: true
}));

// Body Parser
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
