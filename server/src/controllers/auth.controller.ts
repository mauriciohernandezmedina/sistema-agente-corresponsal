import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      // Simple hardcoded validation or env var check
      // In a real app, check against a database
      const validUser = process.env.ADMIN_USER || 'admin';
      const validPass = process.env.ADMIN_PASSWORD || 'admin';

      if (username === validUser && password === validPass) {
        const secret = process.env.JWT_SECRET || 'default_secret_do_not_use_in_prod';
        const token = jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '1h' });

        return res.status(200).json({
          success: true,
          token
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
