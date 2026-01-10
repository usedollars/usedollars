import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Transaction } from '../entities/Transaction';
import { Wallet } from '../entities/Wallet';
import { v4 as uuidv4 } from 'uuid';

const transactionRepo = AppDataSource.getRepository(Transaction);
const walletRepo = AppDataSource.getRepository(Wallet);

// Crear transacción (depósito o retiro)
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { wallet_id, type, amount, description } = req.body;

    if (!wallet_id || !type || !amount) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const wallet = await walletRepo.findOne({ where: { id: wallet_id } });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet no encontrada' });
    }

    const transaction = transactionRepo.create({
      id: uuidv4(),
      wallet,
      type,
      amount,
      description,
      created_at: new Date()
    });

    await transactionRepo.save(transaction);

    // Actualizar balance de la wallet
    if (type === 'deposit') wallet.balance += amount;
    else if (type === 'withdraw') wallet.balance -= amount;
    await walletRepo.save(wallet);

    res.status(201).json({ message: 'Transacción creada', transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creando la transacción' });
  }
};

// Obtener transacciones por wallet
export const getTransactionsByWallet = async (req: Request, res: Response) => {
  try {
    const { wallet_id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const wallet = await walletRepo.findOne({ where: { id: wallet_id } });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet no encontrada' });
    }

    const [transactions, total] = await transactionRepo.findAndCount({
      where: { wallet: { id: wallet_id } },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    res.json({
      wallet_id,
      page,
      limit,
      total,
      transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo transacciones' });
  }
};

