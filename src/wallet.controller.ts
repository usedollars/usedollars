import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';

const walletService = new WalletService();

export class WalletController {
  // Obtener las wallets del usuario logueado
  static async getMyWallets(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id; // JWT middleware agrega req.user
      const wallets = await walletService.getMyWallets(userId);
      res.json(wallets);
    } catch (err: any) {
      console.error('[ERROR] getMyWallets:', err);
      res.status(400).json({ error: err.message });
    }
  }

  // Transferir fondos a otro usuario interno
  static async transfer(req: Request, res: Response) {
    try {
      const fromUserId = (req as any).user.id; // JWT middleware
      const { toUserEmail, amount, currency } = req.body;

      // Validaciones básicas
      if (!toUserEmail || !amount || !currency) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      const result = await walletService.transfer({
        fromUserId,
        toUserEmail,
        amount,
        currency,
      });

      res.json({ message: 'Transferencia exitosa', result });
    } catch (err: any) {
      console.error('[ERROR] transfer:', err);
      res.status(400).json({ error: err.message });
    }
  }

  // Crear wallet nueva (opcional si quieres exponer esta ruta)
  static async createWallet(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { currency, balance } = req.body;

      if (!currency || balance === undefined) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      const wallet = await walletService.createWallet({
        userId,
        currency,
        balance,
      });

      res.status(201).json(wallet);
    } catch (err: any) {
      console.error('[ERROR] createWallet:', err);
      res.status(400).json({ error: err.message });
    }
  }
}

