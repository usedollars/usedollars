import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { EscrowService } from '../services/escrow.service';
import { Transaction } from '../entities/transaction';

const escrowService = new EscrowService(AppDataSource);

export const createOrder = async (req: Request, res: Response) => {
  const { sellerId, amount, asset, type } = req.body;
  const buyerId = (req as any).user.id; // Sacado del JWT

  try {
    // 1. Creamos el registro de la transacción en estado 'PENDING'
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const newTransaction = transactionRepo.create({
      amount,
      asset,
      type: 'P2P_TRADE',
      status: 'PENDING',
      sender: { id: type === 'BUY' ? sellerId : buyerId },
      receiver: { id: type === 'BUY' ? buyerId : sellerId }
    });
    
    await transactionRepo.save(newTransaction);

    // 2. Si es una compra, bloqueamos los fondos del vendedor inmediatamente
    if (type === 'BUY') {
      await escrowService.lockFunds(sellerId, buyerId, amount, asset, newTransaction.id);
    }

    res.status(201).json({
      success: true,
      orderId: newTransaction.id,
      message: "Orden creada y fondos protegidos en Escrow."
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};