import { AppDataSource } from "../data-source";
import { User } from "../entities/user";
import { Transaction } from "../entities/transaction";
import { Wallet } from "../entities/wallet";
import { Decimal } from 'decimal.js';

export class TransactionService {
    
    /**
     * PROCESAR TRANSFERENCIA INTERNA
     * Centraliza la lógica de envío, comisiones y referidos.
     */
    static async processInternalTransfer(senderId: number, toUserEmail: string, amount: number, currency: string) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const asset = currency.toLowerCase();
            const transferAmount = new Decimal(amount);
            const fee = new Decimal(1); // Comisión fija de 1 unidad
            const totalToDeduct = transferAmount.plus(fee);

            // 1. Localizar actores (Traemos referido para el bono)
            const sender = await queryRunner.manager.findOne(User, { 
                where: { id: senderId }, 
                relations: ['referredBy'] 
            });
            const receiver = await queryRunner.manager.findOne(User, { where: { email: toUserEmail } });

            if (!receiver) throw new Error("El destinatario no existe en Usedollars.");
            if (sender?.id === receiver.id) throw new Error("No puedes enviarte fondos a ti mismo.");

            // 2. Gestión de Billetera Emisor
            const senderWallet = await queryRunner.manager.findOne(Wallet, { 
                where: { user: { id: senderId }, currency: asset },
                lock: { mode: "pessimistic_write" } 
            });

            if (!senderWallet || new Decimal(senderWallet.balance).lt(totalToDeduct)) {
                throw new Error(`Saldo insuficiente. Necesitas ${totalToDeduct} ${asset.toUpperCase()}`);
            }

            // 3. Gestión de Billetera Receptor
            let receiverWallet = await queryRunner.manager.findOne(Wallet, { 
                where: { user: { id: receiver.id }, currency: asset } 
            });
            
            if (!receiverWallet) {
                receiverWallet = queryRunner.manager.create(Wallet, { 
                    user: receiver, currency: asset, balance: 0, address: `INT-${receiver.id}-${Date.now()}` 
                });
                await queryRunner.manager.save(Wallet, receiverWallet);
            }

            // 4. Pago de Comisión por Referido (0.25 USDT)
            if (sender?.referredBy) {
                const refWallet = await queryRunner.manager.findOne(Wallet, { 
                    where: { user: { id: sender.referredBy.id }, currency: 'usdt' } 
                });
                if (refWallet) {
                    refWallet.balance = new Decimal(refWallet.balance).plus(0.25).toNumber();
                    await queryRunner.manager.save(Wallet, refWallet);
                }
            }

            // 5. Actualizar Saldos
            senderWallet.balance = new Decimal(senderWallet.balance).minus(totalToDeduct).toNumber();
            receiverWallet.balance = new Decimal(receiverWallet.balance).plus(transferAmount).toNumber();
            
            await queryRunner.manager.save(Wallet, [senderWallet, receiverWallet]);

            // 6. Crear Registro de Transacción
            const tx = queryRunner.manager.create(Transaction, {
                sender: sender!,
                receiver,
                amount: transferAmount.toNumber(),
                asset,
                type: 'internal_transfer',
                status: 'completed'
            });
            await queryRunner.manager.save(Transaction, tx);

            await queryRunner.commitTransaction();
            return tx;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}