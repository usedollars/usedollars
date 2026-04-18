import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const ALLOWED_ASSETS = ['usdt', 'btc', 'eth', 'dop']; 

export const validateInternalTransfer = [
  // 1. LOG DE SEGURIDAD: Esto imprimirá en tu terminal lo que llega del front
  (req: Request, res: Response, next: NextFunction) => {
    console.log("--- DATOS RECIBIDOS EN EL BACKEND ---");
    console.log(req.body); 
    console.log("-------------------------------------");
    next();
  },

  body('toUserEmail').isEmail().withMessage('Email inválido'),
  body('amount').isFloat({ gt: 0 }).withMessage('Monto debe ser > 0'),
  body('currency').isString().toLowerCase().isIn(ALLOWED_ASSETS).withMessage('Moneda no válida'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Error de validación",
        recibido: req.body, // 👈 Esto te dirá en el navegador qué llegó mal
        errors: errors.array() 
      });
    }
    next();
  }
];