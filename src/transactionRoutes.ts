import { Router } from 'express';
import { createTransaction, getTransactionsByWallet } from '../controllers/transaction.controller';

const router = Router();

router.post('/transactions', createTransaction);
router.get('/transactions/:wallet_id', getTransactionsByWallet);

export default router;

