import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Ruta protegida: /api/user/profile
router.get('/profile', authenticateJWT, (req: Request & { user?: any }, res: Response) => {
  const user = req.user;
  res.json({
    message: `Perfil accedido correctamente`,
    user: {
      id: user.userId,
      email: user.email
    }
  });
});

export default router;

