const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// POST /api/transactions - Crear nueva transacción
router.post('/transactions', transactionController.createTransaction);

// GET /api/transactions/:wallet_id - Obtener transacciones por wallet
router.get('/transactions/:wallet_id', transactionController.getTransactionsByWallet);

// GET /api/transaction/:id - Obtener transacción específica
router.get('/transaction/:id', transactionController.getTransactionById);

module.exports = router;
