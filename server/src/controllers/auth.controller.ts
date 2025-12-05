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
        
        // Información del usuario y ubicación del banco corresponsal
        // En producción, esta información vendría de una base de datos
        const userInfo = {
          username,
          role: 'admin',
          agencia: process.env.AGENCIA_NOMBRE || 'Agencia Principal',
          sucursal: process.env.SUCURSAL_NOMBRE || 'Sucursal Central',
          codigoAgencia: process.env.AGENCIA_CODIGO || 'AG001',
          codigoSucursal: process.env.SUCURSAL_CODIGO || 'SUC001'
        };
        
        const token = jwt.sign(userInfo, secret, { expiresIn: '24h' });

        return res.status(200).json({
          success: true,
          token,
          user: {
            username: userInfo.username,
            agencia: userInfo.agencia,
            sucursal: userInfo.sucursal
          }
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
