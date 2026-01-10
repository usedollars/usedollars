import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Authorization header:', authHeader); // Para debug
  console.log('Extracted token:', token); // Para debug

  if (!token) {
    res.status(401).json({ error: 'Token de acceso requerido' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded); // Para debug
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification error:', error); // Para debug
    res.status(403).json({ error: 'Token inválido o expirado' });
  }
}
