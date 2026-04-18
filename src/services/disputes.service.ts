import { AppDataSource } from "../data-source";
import { Dispute } from "../entities/Dispute";
import { Transaction } from "../entities/transaction";
import { Wallet } from "../entities/wallet";
import { Decimal } from 'decimal.js'; 

// CAMBIO: Nombre en Singular para coincidir con tu import
export class DisputeService {

  /**
   * RESOLVER DISPUTA (Estático: No requiere 'new')
   */
  static async resolveDispute(
    disputeId: number, 
    adminId: number, 
    decision: 'REFUND' | 'RELEASE', 
    adminNotes: string
  ) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const dispute = await queryRunner.manager.findOne(Dispute, {
        where: { id: disputeId },
        relations: ["transaction", "transaction.sender", "transaction.receiver"],
        lock: { mode: "pessimistic_write" }
      });

      if (!dispute) throw new Error("Disputa no encontrada.");
      if (dispute.status !== 'OPEN') throw new Error("Esta disputa ya fue cerrada.");

      const tx = dispute.transaction;
      const amount = new Decimal(tx.amount.toString());
      const asset = tx.asset;

      const receiverWallet = await queryRunner.manager.findOne(Wallet, {
        where: { user: { id: tx.receiver.id }, currency: asset },
        lock: { mode: "pessimistic_write" }
      });

      if (!receiverWallet) throw new Error("Billetera del receptor no encontrada.");

      const lockedBalance = new Decimal(receiverWallet.locked_balance.toString());
      
      if (lockedBalance.lessThan(amount)) {
         throw new Error("Error contable: Saldo congelado insuficiente.");
      }

      if (decision === 'REFUND') {
        // GANA EL EMISOR (Reembolso)
        const senderWallet = await queryRunner.manager.findOne(Wallet, {
            where: { user: { id: tx.sender.id }, currency: asset },
            lock: { mode: "pessimistic_write" }
        });
        if (!senderWallet) throw new Error("Billetera del emisor no encontrada.");

        receiverWallet.locked_balance = lockedBalance.minus(amount).toNumber();
        const senderBalance = new Decimal(senderWallet.balance.toString());
        senderWallet.balance = senderBalance.plus(amount).toNumber();

        await queryRunner.manager.save(Wallet, [receiverWallet, senderWallet]);
        tx.status = 'refunded' as any;
        dispute.winner = 'SENDER' as any;

      } else if (decision === 'RELEASE') {
        // GANA EL RECEPTOR (Liberación)
        receiverWallet.locked_balance = lockedBalance.minus(amount).toNumber();
        const receiverBalance = new Decimal(receiverWallet.balance.toString());
        receiverWallet.balance = receiverBalance.plus(amount).toNumber();

        await queryRunner.manager.save(Wallet, receiverWallet);
        tx.status = 'completed' as any;
        dispute.winner = 'RECEIVER' as any;
      }

      dispute.status = 'RESOLVED' as any;
      dispute.admin_notes = adminNotes;
      dispute.resolved_at = new Date();
      
      await queryRunner.manager.save(Dispute, dispute);
      await queryRunner.manager.save(Transaction, tx);

      await queryRunner.commitTransaction();
      return { 
        success: true, 
        message: `Disputa resuelta: ${decision}` 
      };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}