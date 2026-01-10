import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

export const getProfile = (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;
  res.json({ 
    message: 'Perfil del usuario',
    user: authenticatedReq.user 
  });
};

export const getDashboard = (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;
  res.json({ 
    message: 'Dashboard del usuario',
    userId: authenticatedReq.user?.userId,
    email: authenticatedReq.user?.email,
    timestamp: new Date().toISOString()
  });
};
