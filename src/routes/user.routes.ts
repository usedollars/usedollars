import { Router } from 'express';
import { getProfile, getDashboard } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/profile', getProfile);
router.get('/dashboard', getDashboard);

export default router;
