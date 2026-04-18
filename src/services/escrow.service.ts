import { DataSource, QueryRunner } from "typeorm";
import { Transaction } from "../entities/transaction";
import { Wallet } from "../entities/wallet";
import { io } from "../index"; // Importamos el socket que configuramos en index.ts

export class EscrowService {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Bloquea los fondos del vendedor al iniciar una orden P2P
   */
  async lockFunds(sellerId: number, buyerId: number, amount: number, asset: string, transactionId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueo pesimista para evitar que el vendedor gaste el dinero en otra pestaña
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { user_id: sellerId, currency: asset },
        lock: { mode: "pessimistic_write" }
      });

      if (!wallet) throw new Error("Billetera no encontrada.");
      
      const currentBalance = Number(wallet.balance);
      if (currentBalance < amount) throw new Error("Saldo insuficiente.");

      // 2. Restamos saldo al vendedor
      wallet.balance = currentBalance - amount;
      await queryRunner.manager.save(wallet);

      // 3. Cambiamos estado de la transacción
      const transaction = await queryRunner.manager.findOne(Transaction, { where: { id: transactionId } });
      if (transaction) {
        transaction.status = "LOCKED";
        await queryRunner.manager.save(transaction);
      }

      await queryRunner.commitTransaction();

      // --- NOTIFICACIÓN EN TIEMPO REAL ---
      // Avisamos al comprador que ya puede transferir el dinero (CASH/BANK)
      io.to(`user_${buyerId}`).emit("notification", {
        type: "ESCROW_LOCKED",
        message: `El vendedor ha bloqueado ${amount} ${asset.toUpperCase()}. Ya puedes realizar el pago.`,
        transactionId
      });

      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Libera los fondos al comprador (El vendedor confirma que recibió el pago)
   */
  async releaseToBuyer(buyerId: number, amount: number, asset: string, transactionId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscamos (o creamos) la billetera del comprador
      let wallet = await queryRunner.manager.findOne(Wallet, {
        where: { user_id: buyerId, currency: asset },
        lock: { mode: "pessimistic_write" }
      });

      if (!wallet) {
        wallet = queryRunner.manager.create(Wallet, {
          user_id: buyerId,
          currency: asset,
          balance: 0
        });
      }

      // 2. Acreditamos los fondos
      wallet.balance = Number(wallet.balance) + Number(amount);
      await queryRunner.manager.save(wallet);

      // 3. Finalizamos la transacción
      const transaction = await queryRunner.manager.findOne(Transaction, { where: { id: transactionId } });
      if (transaction) {
        transaction.status = "COMPLETED";
        await queryRunner.manager.save(transaction);
      }

      await queryRunner.commitTransaction();

      // --- NOTIFICACIÓN EN TIEMPO REAL ---
      io.to(`user_${buyerId}`).emit("notification", {
        type: "FUNDS_RELEASED",
        message: `¡Fondos liberados! Has recibido ${amount} ${asset.toUpperCase()} en tu billetera.`,
        transactionId
      });

      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}