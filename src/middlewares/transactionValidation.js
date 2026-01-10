const { body, param } = require('express-validator');

const validateTransaction = [
  body('wallet_id')
    .isUUID()
    .withMessage('Wallet ID debe ser un UUID válido'),
  
  body('type')
    .isIn(['deposit', 'withdrawal', 'transfer', 'fee'])
    .withMessage('Tipo de transacción no válido'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser mayor a 0'),
  
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('La descripción no puede exceder 255 caracteres')
];

const validateWalletParam = [
  param('wallet_id')
    .isUUID()
    .withMessage('Wallet ID debe ser un UUID válido')
];

module.exports = {
  validateTransaction,
  validateWalletParam
};
