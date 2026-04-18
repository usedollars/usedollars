import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';

// 👇 CAMBIO: Agregué la 's' en 'middlewares'
import { verifyToken } from '../middlewares/auth.middleware'; 

const router = Router();

// Bloqueamos todas las rutas con el token
router.use(verifyToken);

router.get('/me', WalletController.getMyWallets);
router.post('/create', WalletController.createWallet);
router.post('/transfer', WalletController.transfer);

export const walletRouter = router;