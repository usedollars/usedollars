import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Wallet } from '../entities/wallet';
import { Transaction } from '../entities/transaction';

export class DashboardController {
  
  static async getDashboardData(req: Request, res: Response) {
    const { userId } = req.params; // O sacarlo del token (req.user.id)
    const manager = AppDataSource.manager;

    try {
      // 1. Obtener Billeteras
      const wallets = await manager.find(Wallet, {
        where: { user: { id: userId } },
        select: ['currency', 'balance', 'locked_balance']
      });

      // 2. Consulta de Límites (SQL puro para máxima velocidad en tu M.2)
      const limitsData = await manager.query(`
        SELECT 
            l.level_name,
            l.daily_limit_base as total_limit,
            COALESCE(SUM(t.amount), 0) as used_today
        FROM user_profiles p
        JOIN kyc_levels l ON p.region_id = l.region_id AND p.kyc_level_tier = l.level_tier
        LEFT JOIN wallets w ON w.user_id = p.user_id
        LEFT JOIN transactions t ON t.wallet_id = w.id 
            AND t.created_at >= CURRENT_DATE 
            AND t.status = 'completed'
            AND t.type IN ('WITHDRAWAL', 'TRANSFER_OUT')
        WHERE p.user_id = $1
        GROUP BY l.level_name, l.daily_limit_base
      `, [userId]);

      const limits = limitsData[0] || { level_name: 'Básico', total_limit: 0, used_today: 0 };

      // 3. Respuesta consolidada
      res.json({
        ok: true,
        balances: wallets,
        limits: {
            name: limits.level_name,
            total: Number(limits.total_limit),
            used: Number(limits.used_today),
            remaining: Number(limits.total_limit) - Number(limits.used_today)
        }
      });

    } catch (err: any) {
      res.status(500).json({ ok: false, error: "Error al cargar datos del panel" });
    }
  }
}