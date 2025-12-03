import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthController } from '../controllers/auth.controller';
import { BankingController } from '../controllers/banking.controller';

const router = Router();

// Middleware for JWT authentication
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  const secret = process.env.JWT_SECRET || 'default_secret_do_not_use_in_prod';

  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    (req as any).user = user;
    next();
  });
};

// Auth Routes
router.post('/auth/login', AuthController.login);

// Banking Routes
// GET /clients - Protected
router.get('/clients', authenticateToken, BankingController.searchClients);

// GET /loans/:id
router.get('/loans/:id', authenticateToken, BankingController.getLoanDetail);

// POST /loans/:id/transactions
router.post('/loans/:id/transactions', authenticateToken, BankingController.makeRepayment);

// POST /transactions/:id/reverse
router.post('/transactions/:id/reverse', authenticateToken, BankingController.reversePayment);

export default router;
