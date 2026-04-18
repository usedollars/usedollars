import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Order } from '../entities/order';
import { Wallet } from '../entities/wallet'; // 👈 Añadido el import faltante
import { Decimal } from 'decimal.js'; // 👈 Añadido el import faltante
import { TransactionController } from './transaction.controller'; // 👈 Importación limpia

export class OrderController {
  /**
   * Crear una orden (utiliza directamente la lógica blindada de TransactionController)
   */
  static async createOrder(req: Request, res: Response) {
    // Ya no usamos require, usamos la referencia directa al motor de decisión
    return TransactionController.initiateP2P(req, res);
  }

  /**
   * Obtener historial de órdenes del usuario
   */
  static async getUserOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const orders = await AppDataSource.getRepository(Order).find({
        where: { user: { id: userId } },
        order: { created_at: 'DESC' },
        relations: ['user']
      });
      res.json({ ok: true, orders });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  /**
   * Cancelar orden desde el listado (Actualizado para el nuevo Escrow y OPEN_MARKET)
   */
  static async cancelOrder(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { orderId } = req.params;
      const userId = (req as any).user.id;

      // [CORRECCIÓN]: Buscamos por OPEN_MARKET que es el estado real en nuestro nuevo tablero
      const order = await queryRunner.manager.createQueryBuilder(Order, 'order')
        .where('order.id = :orderId', { orderId })
        .andWhere('order.user.id = :userId', { userId })
        .andWhere('order.status IN (:...statuses)', { statuses: ['OPEN_MARKET', 'PENDING_MATCH'] })
        .setLock('pessimistic_write')
        .getOne();

      if (!order) throw new Error("La orden no existe, ya fue tomada o no se puede cancelar.");

      const amount = new Decimal(order.amount);

      // --- DEVOLUCIÓN DE FONDOS DEL ESCROW ---
      
      if (order.type === 'SELL') {
        // Vendedor: Devolver Cripto bloqueada
        const wallet = await queryRunner.manager.createQueryBuilder(Wallet, 'wallet')
          .where('wallet.user.id = :userId', { userId })
          .andWhere('wallet.currency ILIKE :currency', { currency: order.asset })
          .setLock('pessimistic_write')
          .getOne();

        if (wallet) {
          wallet.locked_balance = new Decimal(wallet.locked_balance || 0).minus(amount).toNumber();
          wallet.balance = new Decimal(wallet.balance).plus(amount).toNumber();
          await queryRunner.manager.save(Wallet, wallet);
        }
      } else {
        // Comprador: Devolver saldo Fiat (si no es USD, devolvemos el saldo bloqueado en la plataforma)
        if (order.currency.toLowerCase() !== 'usd') {
          const totalFiat = amount.times(new Decimal(order.price));
          const fiatWallet = await queryRunner.manager.createQueryBuilder(Wallet, 'wallet')
            .where('wallet.user.id = :userId', { userId })
            .andWhere('wallet.currency ILIKE :currency', { currency: order.currency })
            .setLock('pessimistic_write')
            .getOne();

          if (fiatWallet) {
            fiatWallet.locked_balance = new Decimal(fiatWallet.locked_balance || 0).minus(totalFiat).toNumber();
            fiatWallet.balance = new Decimal(fiatWallet.balance).plus(totalFiat).toNumber();
            await queryRunner.manager.save(Wallet, fiatWallet);
          }
        }
      }

      order.status = 'CANCELLED';
      await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      res.json({ ok: true, msg: "Orden cancelada y fondos liberados del Escrow." });
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({ ok: false, error: error.message });
    } finally {
      await queryRunner.release();
    }
  }
}