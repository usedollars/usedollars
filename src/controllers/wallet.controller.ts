import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';

export class WalletController {
  private static walletService = new WalletService();

  // Obtener las wallets del usuario logueado
  static async getMyWallets(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new Error('Usuario no autenticado.');

      const wallets = await WalletController.walletService.getMyWallets(userId);
      res.json(wallets);
    } catch (err: any) {
      console.error('[ERROR] getMyWallets:', err.message);
      res.status(400).json({ error: err.message });
    }
  }

  // Crear una nueva wallet
  static async createWallet(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { currency } = req.body;
      const wallet = await WalletController.walletService.createWallet(userId, currency);
      res.json(wallet);
    } catch (err: any) {
      console.error('[ERROR] createWallet:', err.message);
      res.status(400).json({ error: err.message });
    }
  }

  // Transferencia entre usuarios
  static async transfer(req: Request, res: Response) {
    try {
      const fromUserId = (req as any).user?.id;
      if (!fromUserId) throw new Error('Usuario no autenticado.');

      const { toUserEmail, amount, currency } = req.body;
      const result = await WalletController.walletService.transfer({
        fromUserId,
        toUserEmail,
        amount,
        currency,
      });
      res.json({ message: 'Transferencia exitosa', result });
    } catch (err: any) {
      console.error('[ERROR] transfer:', err.message);
      res.status(400).json({ error: err.message });
    }
  }
}

