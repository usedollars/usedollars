import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service'; 

const walletService = new WalletService();

export class WalletController {
  
  // Obtener las wallets del usuario logueado
  static async getMyWallets(req: Request, res: Response) {
    console.log("--> PETICIÓN RECIBIDA EN BACKEND: Buscando wallets...");
    try {
      const userId = (req as any).user?.id;
      const wallets = await walletService.getMyWallets(userId);
      
      // ✅ CAMBIO CLAVE: Devolvemos un objeto con 'ok: true'
      // Esto permite al Frontend validar que la petición fue exitosa
      res.json({ ok: true, wallets });
      
    } catch (err: any) {
      // También estandarizamos el error
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  static async createWallet(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { currency } = req.body;
      const wallet = await walletService.createWallet(userId, currency);
      res.json({ ok: true, wallet }); // Agregamos ok: true
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  static async transfer(req: Request, res: Response) {
    try {
      const fromUserId = (req as any).user?.id;
      const { toUserEmail, amount, currency } = req.body;
      const result = await walletService.transfer({ fromUserId, toUserEmail, amount, currency });
      res.json({ ok: true, message: 'Transferencia exitosa', result });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }
}