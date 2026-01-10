import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/me', authMiddleware, WalletController.getMyWallets);
router.post('/create', authMiddleware, WalletController.createWallet);
router.post('/transfer', authMiddleware, WalletController.transfer);

export default router;

