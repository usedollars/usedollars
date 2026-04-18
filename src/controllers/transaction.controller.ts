import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/user';
import { Transaction } from '../entities/transaction';
import { Wallet } from '../entities/wallet';
import { Order } from '../entities/order';
import { Dispute } from '../entities/Dispute';
import { Decimal } from 'decimal.js';
import { ILike, QueryRunner } from 'typeorm';

const ALLOWED_ASSETS = ['usdt', 'btc', 'eth', 'sol', 'dop'];
const TREASURY_EMAIL = 'treasury@usedollars.com';
const FLAT_FEE_USDT = new Decimal(1);

export class TransactionController {

  // ==================== HELPER SEGURO PARA BLOQUEOS ====================
  private static async getWalletWithLock(queryRunner: QueryRunner, userId: number, currency: string) {
    return await queryRunner.manager.createQueryBuilder(Wallet, 'wallet')
      .innerJoin('wallet.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('wallet.currency ILIKE :currency', { currency })
      .setLock('pessimistic_write') 
      .getOne();
  }

  // ==================== DEPÓSITOS ====================
  static async getDepositAddress(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const userId = (req as any).user.id;
      const { asset, currency, network } = req.body;
      const finalAsset = (asset || currency || '').toLowerCase();
      if (!finalAsset || !ALLOWED_ASSETS.includes(finalAsset)) {
        throw new Error(`Activo no soportado: ${finalAsset}`);
      }
      let wallet = await queryRunner.manager.findOne(Wallet, {
        where: { user: { id: userId }, currency: ILike(finalAsset) }
      });
      if (!wallet) {
        const mockAddress = `0x${userId}${Date.now().toString(16).toUpperCase()}`;
        wallet = queryRunner.manager.create(Wallet, {
          user: { id: userId } as User,
          currency: finalAsset,
          balance: 0,
          locked_balance: 0,
          address: mockAddress
        });
        await queryRunner.manager.save(Wallet, wallet);
      }
      return res.json({
        ok: true,
        asset: finalAsset.toUpperCase(),
        network: network || 'Mainnet',
        address: wallet.address,
        qr_code: `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${wallet.address}`
      });
    } catch (err: any) {
      return res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  static async simulateDeposit(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userId = (req as any).user.id;
      const { amount, asset, currency } = req.body;
      const finalAsset = (asset || currency || '').toLowerCase();
      if (!amount || !finalAsset) throw new Error('Faltan datos para el depósito.');
      const depositAmount = new Decimal(amount);
      if (depositAmount.lessThanOrEqualTo(0)) throw new Error('El monto debe ser mayor a 0.');
      
      let wallet = await TransactionController.getWalletWithLock(queryRunner, userId, finalAsset);
      
      if (!wallet) {
        wallet = queryRunner.manager.create(Wallet, {
          user: { id: userId } as User,
          currency: finalAsset,
          balance: 0,
          locked_balance: 0, 
          address: `DEP-${Date.now()}`
        });
      }
      wallet.balance = new Decimal(wallet.balance).plus(depositAmount).toNumber();
      await queryRunner.manager.save(Wallet, wallet);
      
      const tx = queryRunner.manager.create(Transaction, {
        sender: { id: userId } as User,
        receiver: { id: userId } as User,
        amount: depositAmount.toNumber(),
        asset: finalAsset,
        type: 'deposit',
        status: 'completed'
      });
      await queryRunner.manager.save(Transaction, tx);
      await queryRunner.commitTransaction();
      return res.json({
        ok: true,
        msg: `Depósito de ${amount} ${finalAsset.toUpperCase()} recibido exitosamente.`,
        newBalance: wallet.balance
      });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== MOTOR P2P (MERCADO ABIERTO) ====================
  static async initiateP2P(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const userId = (req as any).user.id;
      const { type, amount, asset, currency, price, fiatCurrency, paymentMethod } = req.body;
      
      const finalAsset = (asset || currency || '').toLowerCase();
      const finalFiat = (fiatCurrency || 'usdt').toLowerCase(); 
      const finalType = (type || 'BUY').toUpperCase(); 
      const counterType = finalType === 'BUY' ? 'SELL' : 'BUY'; 
      
      const amountDecimal = new Decimal(amount);
      const priceDecimal = new Decimal(price || 1);
      const totalFiatNeeded = amountDecimal.times(priceDecimal);

      if (!amount || !finalAsset) throw new Error('Datos de la orden incompletos.');

      const matchOrder = await queryRunner.manager.createQueryBuilder(Order, 'order')
        .innerJoinAndSelect('order.user', 'user') 
        .where('order.type = :type', { type: counterType })
        .andWhere('order.asset ILIKE :asset', { asset: finalAsset })
        .andWhere('order.status = :status', { status: 'OPEN_MARKET' })
        .orderBy('order.created_at', 'ASC')
        .setLock('pessimistic_write')
        .getOne();

      if (matchOrder && matchOrder.user.id === userId) {
        throw new Error('No puedes emparejarte con tu propia orden.');
      }

      if (matchOrder) {
        if (finalType === 'SELL') {
          const sellerWallet = await TransactionController.getWalletWithLock(queryRunner, userId, finalAsset);
          
          if (!sellerWallet || new Decimal(sellerWallet.balance).lessThan(amountDecimal)) {
            throw new Error(`Saldo insuficiente en ${finalAsset.toUpperCase()} para vender.`);
          }
          sellerWallet.balance = new Decimal(sellerWallet.balance).minus(amountDecimal).toNumber();
          sellerWallet.locked_balance = new Decimal(sellerWallet.locked_balance || 0).plus(amountDecimal).toNumber();
          await queryRunner.manager.save(Wallet, sellerWallet);
        } else {
          if (finalFiat !== 'usd') { 
             let fiatWallet = await TransactionController.getWalletWithLock(queryRunner, userId, finalFiat);
             if (!fiatWallet || new Decimal(fiatWallet.balance).lessThan(totalFiatNeeded)) {
                throw new Error(`Saldo insuficiente en ${finalFiat.toUpperCase()} para comprar.`);
             }
             fiatWallet.balance = new Decimal(fiatWallet.balance).minus(totalFiatNeeded).toNumber();
             fiatWallet.locked_balance = new Decimal(fiatWallet.locked_balance || 0).plus(totalFiatNeeded).toNumber();
             await queryRunner.manager.save(Wallet, fiatWallet);
          }
        }

        matchOrder.status = 'WAITING_PAYMENT';
        await queryRunner.manager.save(Order, matchOrder);

        const isMakerSeller = matchOrder.type === 'SELL';
        const transaction = queryRunner.manager.create(Transaction, {
          sender: isMakerSeller ? matchOrder.user : { id: userId } as User,
          receiver: isMakerSeller ? { id: userId } as User : matchOrder.user,
          amount: amountDecimal.toNumber(),
          asset: finalAsset,
          type: 'p2p_trade',
          status: 'pending_payment',
          order: matchOrder
        });
        
        await queryRunner.manager.save(Transaction, transaction);
        await queryRunner.commitTransaction();

        return res.json({
          ok: true,
          status: 'MATCHED',
          msg: '¡Match encontrado!',
          transactionId: transaction.id,
          orderId: matchOrder.id
        });
      } 
      
      else {
        if (finalType === 'SELL') {
          const sellerWallet = await TransactionController.getWalletWithLock(queryRunner, userId, finalAsset);
          
          if (!sellerWallet || new Decimal(sellerWallet.balance).lessThan(amountDecimal)) {
            throw new Error(`Saldo insuficiente para crear orden de venta.`);
          }
          sellerWallet.balance = new Decimal(sellerWallet.balance).minus(amountDecimal).toNumber();
          sellerWallet.locked_balance = new Decimal(sellerWallet.locked_balance || 0).plus(amountDecimal).toNumber();
          await queryRunner.manager.save(Wallet, sellerWallet);
        } else {
          if (finalFiat !== 'usd') {
             const fiatWallet = await TransactionController.getWalletWithLock(queryRunner, userId, finalFiat);
             if (!fiatWallet || new Decimal(fiatWallet.balance).lessThan(totalFiatNeeded)) {
                throw new Error(`Saldo insuficiente para crear orden de compra.`);
             }
             fiatWallet.balance = new Decimal(fiatWallet.balance).minus(totalFiatNeeded).toNumber();
             fiatWallet.locked_balance = new Decimal(fiatWallet.locked_balance || 0).plus(totalFiatNeeded).toNumber();
             await queryRunner.manager.save(Wallet, fiatWallet);
          }
        }

        const newOrder = queryRunner.manager.create(Order, {
          user: { id: userId } as User,
          amount: amountDecimal.toNumber(),
          asset: finalAsset,
          type: finalType,
          status: 'OPEN_MARKET',
          price: priceDecimal.toNumber(),
          currency: finalFiat,
          paymentInstructions: paymentMethod 
        });
        await queryRunner.manager.save(Order, newOrder);
        await queryRunner.commitTransaction();

        return res.json({
          ok: true,
          status: 'OPEN',
          msg: 'Orden publicada en el mercado P2P. Esperando comerciante...',
          orderId: newOrder.id
        });
      }

    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== CONSULTAS (ORDER BOOK) ====================
  static async getOrderStatus(req: Request, res: Response) { 
      const { id } = req.params;
      try {
        const order = await AppDataSource.getRepository(Order).findOne({ 
            where: { id: Number(id) }, 
            relations: ['user'] 
        });

        const transaction = await AppDataSource.getRepository(Transaction).findOne({ 
            where: { order: { id: Number(id) } }, 
            relations: ['sender', 'receiver'] 
        });

        return res.json({ ok: true, order, transaction });
      } catch (error: any) {
        return res.status(500).json({ ok: false, error: error.message });
      }
  }

  static async getOpenOrders(req: Request, res: Response) {
      try {
        const userId = (req as any).user.id;
        const orders = await AppDataSource.getRepository(Order).find({
          where: { status: 'OPEN_MARKET' },
          relations: ['user'],
          order: { created_at: 'DESC' }
        });
        const filtered = orders.filter(o => o.user.id !== userId);
        res.json({ ok: true, orders: filtered });
      } catch (error: any) {
        res.status(500).json({ ok: false, error: error.message });
      }
  }

  // ==================== ACEPTAR ORDEN DEL MERCADO ====================
  static async acceptOrder(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const accepterId = (req as any).user.id;
      const { orderId } = req.body;

      const order = await queryRunner.manager.createQueryBuilder(Order, 'order')
        .innerJoinAndSelect('order.user', 'user')
        .where('order.id = :orderId', { orderId })
        .andWhere('order.status = :status', { status: 'OPEN_MARKET' })
        .setLock('pessimistic_write')
        .getOne();

      if (!order) throw new Error('La orden ya fue tomada o no está disponible.');
      if (order.user.id === accepterId) throw new Error('No puedes aceptar tu propia orden.');

      const amount = new Decimal(order.amount);
      const price = new Decimal(order.price);
      const totalFiat = amount.times(price);

      if (order.type === 'BUY') {
        const accepterCryptoWallet = await TransactionController.getWalletWithLock(queryRunner, accepterId, order.asset);
        
        if (!accepterCryptoWallet || new Decimal(accepterCryptoWallet.balance).lessThan(amount)) {
          throw new Error(`No tienes suficientes ${order.asset.toUpperCase()} para vender.`);
        }
        accepterCryptoWallet.balance = new Decimal(accepterCryptoWallet.balance).minus(amount).toNumber();
        accepterCryptoWallet.locked_balance = new Decimal(accepterCryptoWallet.locked_balance || 0).plus(amount).toNumber();
        await queryRunner.manager.save(Wallet, accepterCryptoWallet);
      } else {
        const currency = order.currency.toLowerCase();
        if (currency !== 'usd') {
            const accepterFiatWallet = await TransactionController.getWalletWithLock(queryRunner, accepterId, currency);
            if (!accepterFiatWallet || new Decimal(accepterFiatWallet.balance).lessThan(totalFiat)) {
              throw new Error(`No tienes suficientes ${order.currency.toUpperCase()} para comprar.`);
            }
            accepterFiatWallet.balance = new Decimal(accepterFiatWallet.balance).minus(totalFiat).toNumber();
            accepterFiatWallet.locked_balance = new Decimal(accepterFiatWallet.locked_balance || 0).plus(totalFiat).toNumber();
            await queryRunner.manager.save(Wallet, accepterFiatWallet);
        }
      }

      order.status = 'WAITING_PAYMENT';
      await queryRunner.manager.save(Order, order);

      const transaction = queryRunner.manager.create(Transaction, {
        sender: order.type === 'SELL' ? order.user : { id: accepterId } as User,
        receiver: order.type === 'BUY' ? order.user : { id: accepterId } as User,
        amount: order.amount,
        asset: order.asset,
        type: 'p2p_trade',
        status: 'pending_payment',
        order: order 
      });
      await queryRunner.manager.save(Transaction, transaction);

      await queryRunner.commitTransaction();
      return res.json({
        ok: true,
        msg: 'Orden tomada exitosamente. Procede al pago.',
        transactionId: transaction.id
      });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== CANCELAR ÓRDENES P2P (NUEVO) ====================
  
  // 1. Cancelar antes de que alguien la tome (Recuperar Escrow)
  static async cancelP2POrder(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userId = (req as any).user.id;
      const { orderId } = req.params;

      const order = await queryRunner.manager.createQueryBuilder(Order, 'order')
        .innerJoinAndSelect('order.user', 'user')
        .where('order.id = :orderId', { orderId })
        .andWhere('order.status = :status', { status: 'OPEN_MARKET' }) // Solo si no ha sido tomada
        .setLock('pessimistic_write')
        .getOne();

      if (!order) throw new Error('Orden no encontrada o ya está en proceso.');
      if (order.user.id !== userId) throw new Error('No puedes cancelar una orden que no es tuya.');

      const amount = new Decimal(order.amount);
      const totalFiat = amount.times(new Decimal(order.price));

      // Devolver los fondos bloqueados
      if (order.type === 'SELL') {
        const wallet = await TransactionController.getWalletWithLock(queryRunner, userId, order.asset);
        if (wallet) {
          wallet.locked_balance = new Decimal(wallet.locked_balance || 0).minus(amount).toNumber();
          wallet.balance = new Decimal(wallet.balance).plus(amount).toNumber();
          await queryRunner.manager.save(Wallet, wallet);
        }
      } else if (order.currency.toLowerCase() !== 'usd') {
        const wallet = await TransactionController.getWalletWithLock(queryRunner, userId, order.currency.toLowerCase());
        if (wallet) {
          wallet.locked_balance = new Decimal(wallet.locked_balance || 0).minus(totalFiat).toNumber();
          wallet.balance = new Decimal(wallet.balance).plus(totalFiat).toNumber();
          await queryRunner.manager.save(Wallet, wallet);
        }
      }

      order.status = 'CANCELLED';
      await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      return res.json({ ok: true, msg: 'Orden cancelada. Fondos liberados del Escrow.' });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // 2. Cancelar cuando el comprador no pagó a tiempo
  static async cancelOrderForNonPayment(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userId = (req as any).user.id;
      const { transactionId } = req.params;

      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id: Number(transactionId), status: 'pending_payment' }, // Solo si no han marcado "Pago Enviado"
        relations: ['sender', 'receiver', 'order']
      });

      if (!transaction) throw new Error('Transacción no válida o ya se envió el pago.');
      if (transaction.sender.id !== userId) throw new Error('Solo el vendedor (quien tiene los fondos bloqueados) puede cancelar por falta de pago.');

      const amount = new Decimal(transaction.amount);

      // Liberar Escrow del vendedor
      const senderWallet = await TransactionController.getWalletWithLock(queryRunner, userId, transaction.asset);
      if (!senderWallet) throw new Error('Wallet del vendedor no encontrada.');
      
      senderWallet.locked_balance = new Decimal(senderWallet.locked_balance || 0).minus(amount).toNumber();
      senderWallet.balance = new Decimal(senderWallet.balance).plus(amount).toNumber();
      await queryRunner.manager.save(Wallet, senderWallet);

      transaction.status = 'cancelled';
      if (transaction.order) {
        transaction.order.status = 'CANCELLED';
        await queryRunner.manager.save(Order, transaction.order);
      }
      
      await queryRunner.manager.save(Transaction, transaction);
      await queryRunner.commitTransaction();

      return res.json({ ok: true, msg: 'Comercio cancelado por falta de pago. Criptomonedas recuperadas.' });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== FLUJO DE PAGO ====================
  static async markPaymentSent(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userId = (req as any).user.id;
      const { transactionId } = req.body;
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id: transactionId, status: 'pending_payment' },
        relations: ['sender', 'receiver']
      });
      if (!transaction) throw new Error('Transacción no encontrada.');
      if (transaction.receiver.id !== userId) throw new Error('Solo el comprador puede marcar el pago.');

      transaction.status = 'payment_sent';
      await queryRunner.manager.save(Transaction, transaction);
      await queryRunner.commitTransaction();
      res.json({ ok: true, msg: 'Pago marcado como enviado.' });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  static async confirmPaymentReceived(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userId = (req as any).user.id;
      const { transactionId } = req.body;
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id: transactionId, status: 'payment_sent' },
        relations: ['sender', 'receiver']
      });
      if (!transaction) throw new Error('Transacción no encontrada.');
      if (transaction.sender.id !== userId) throw new Error('Solo el vendedor puede confirmar.');

      const amount = new Decimal(transaction.amount);
      const asset = transaction.asset;

      const senderWallet = await TransactionController.getWalletWithLock(queryRunner, transaction.sender.id, asset);
      const receiverWallet = await TransactionController.getWalletWithLock(queryRunner, transaction.receiver.id, asset);

      if (!senderWallet) throw new Error('Wallet del vendedor no encontrada.');
      if (new Decimal(senderWallet.locked_balance || 0).lessThan(amount)) throw new Error('Error crítico: Fondos insuficientes en escrow.');

      senderWallet.locked_balance = new Decimal(senderWallet.locked_balance).minus(amount).toNumber();
      
      if (receiverWallet) {
         receiverWallet.balance = new Decimal(receiverWallet.balance).plus(amount).toNumber();
         await queryRunner.manager.save(Wallet, senderWallet);
         await queryRunner.manager.save(Wallet, receiverWallet);
      } else {
         await queryRunner.manager.save(Wallet, senderWallet);
         const newReceiverWallet = queryRunner.manager.create(Wallet, {
             user: { id: transaction.receiver.id } as User,
             currency: asset,
             balance: amount.toNumber(),
             locked_balance: 0,
             address: `P2P-${Date.now()}`
         });
         await queryRunner.manager.save(Wallet, newReceiverWallet);
      }

      transaction.status = 'completed';
      await queryRunner.manager.save(Transaction, transaction);
      await queryRunner.commitTransaction();
      res.json({ ok: true, msg: 'Fondos liberados con éxito.' });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== ENVÍO INTERNO ====================
  static async sendInternalAssets(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const senderId = (req as any).user.id;
      const { toUserEmail, amount, currency, asset } = req.body;
      const finalAsset = (asset || currency || '').toLowerCase();
      
      if (!finalAsset || !ALLOWED_ASSETS.includes(finalAsset)) {
        throw new Error(`Activo no soportado: ${finalAsset}`);
      }
      
      const transferAmount = new Decimal(amount);
      if (transferAmount.isNegative() || transferAmount.isZero()) throw new Error('El monto debe ser positivo.');

      await TransactionController.checkUserLimits(senderId, transferAmount, queryRunner);

      const sender = await queryRunner.manager.findOne(User, { where: { id: senderId } });
      const receiver = await queryRunner.manager.findOne(User, { where: { email: toUserEmail } });

      if (!sender) throw new Error('Usuario remitente no válido.');
      if (!receiver) throw new Error('El correo del destinatario no existe.');
      if (sender.id === receiver.id) throw new Error('No puedes enviarte dinero a ti mismo.');

      const senderWallet = await TransactionController.getWalletWithLock(queryRunner, sender.id, finalAsset);
      
      if (!senderWallet || new Decimal(senderWallet.balance).lessThan(transferAmount)) {
        throw new Error(`Fondos insuficientes. Disponible: ${senderWallet?.balance || 0}`);
      }

      let receiverWallet = await TransactionController.getWalletWithLock(queryRunner, receiver.id, finalAsset);
      
      if (!receiverWallet) {
        receiverWallet = queryRunner.manager.create(Wallet, {
          user: receiver,
          currency: finalAsset,
          balance: 0,
          locked_balance: 0,
          address: `INT-${receiver.id}-${Date.now()}`
        });
      }

      senderWallet.balance = new Decimal(senderWallet.balance).minus(transferAmount).toNumber();
      receiverWallet.balance = new Decimal(receiverWallet.balance).plus(transferAmount).toNumber();
      
      await queryRunner.manager.save(Wallet, senderWallet);
      await queryRunner.manager.save(Wallet, receiverWallet);

      const newTx = queryRunner.manager.create(Transaction, {
        sender: sender,
        receiver: receiver,
        amount: transferAmount.toNumber(),
        asset: finalAsset,
        type: 'internal_transfer',
        status: 'completed'
      });
      await queryRunner.manager.save(Transaction, newTx);
      await queryRunner.commitTransaction();
      
      return res.json({ ok: true, msg: 'Transferencia gratuita enviada con éxito.', transactionId: newTx.id });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== RETIROS EXTERNOS ====================
  static async withdrawToExternal(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userId = (req as any).user.id;
      const { amount, asset, currency, externalAddress } = req.body;
      const finalAsset = (asset || currency || '').toLowerCase();
      if (!amount || !externalAddress) throw new Error('Datos de retiro faltantes.');
      
      const withdrawalAmount = new Decimal(amount);
      const totalDeduct = withdrawalAmount.plus(FLAT_FEE_USDT);

      const user = await queryRunner.manager.findOne(User, { 
        where: { id: userId }, 
        relations: ['referredBy'] 
      });
      if (!user) throw new Error('Usuario no encontrado.');

      const userWallet = await TransactionController.getWalletWithLock(queryRunner, userId, finalAsset);

      if (!userWallet || new Decimal(userWallet.balance).lessThan(totalDeduct)) {
        throw new Error(`Saldo insuficiente. Necesitas cubrir ${FLAT_FEE_USDT} USDT de comisión de red.`);
      }
      
      userWallet.balance = new Decimal(userWallet.balance).minus(totalDeduct).toNumber();
      await queryRunner.manager.save(Wallet, userWallet);
      
      // Lógica de recompensa a referidos
      if (user.referredBy && finalAsset === 'usdt') {
        await TransactionController.payFeeToTreasury(queryRunner, new Decimal(0.75), finalAsset);
        
        let referrerWallet = await TransactionController.getWalletWithLock(queryRunner, user.referredBy.id, finalAsset);
        if (referrerWallet) {
          referrerWallet.balance = new Decimal(referrerWallet.balance).plus(0.25).toNumber();
          await queryRunner.manager.save(Wallet, referrerWallet);
          
          const rewardTx = queryRunner.manager.create(Transaction, {
            sender: user,
            receiver: user.referredBy,
            amount: 0.25,
            asset: finalAsset,
            type: 'referral_bonus',
            status: 'completed'
          });
          await queryRunner.manager.save(Transaction, rewardTx);
        }
      } else {
        await TransactionController.payFeeToTreasury(queryRunner, FLAT_FEE_USDT, finalAsset);
      }
      
      const tx = queryRunner.manager.create(Transaction, {
        sender: user,
        amount: withdrawalAmount.toNumber(),
        asset: finalAsset,
        type: 'withdrawal_external',
        status: 'pending' // Pendiente de ejecución por Admin
      });
      await queryRunner.manager.save(Transaction, tx);
      
      await queryRunner.commitTransaction();
      return res.json({ ok: true, msg: 'Retiro solicitado correctamente.', txId: tx.id });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // 3. Procesamiento ADMIN de Retiros (NUEVO)
  static async processExternalWithdrawal(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { transactionId } = req.params;
      const { action } = req.body; // 'approve' o 'reject'

      const tx = await queryRunner.manager.findOne(Transaction, {
        where: { id: Number(transactionId), type: 'withdrawal_external', status: 'pending' },
        relations: ['sender']
      });

      if (!tx) throw new Error('Transacción de retiro no encontrada o ya procesada.');

      if (action === 'approve') {
        tx.status = 'completed';
        await queryRunner.manager.save(Transaction, tx);
        await queryRunner.commitTransaction();
        return res.json({ ok: true, msg: 'Retiro marcado como completado.' });
      } 
      else if (action === 'reject') {
        // Devolvemos el dinero completo al usuario (monto + fee)
        const totalToRefund = new Decimal(tx.amount).plus(FLAT_FEE_USDT);
        const userWallet = await TransactionController.getWalletWithLock(queryRunner, tx.sender.id, tx.asset);
        
        if (userWallet) {
          userWallet.balance = new Decimal(userWallet.balance).plus(totalToRefund).toNumber();
          await queryRunner.manager.save(Wallet, userWallet);
        }

        // Restamos el Fee que le habíamos dado al tesoro
        const treasuryUser = await queryRunner.manager.findOne(User, { where: { email: TREASURY_EMAIL } });
        if (treasuryUser) {
          const treasuryWallet = await TransactionController.getWalletWithLock(queryRunner, treasuryUser.id, tx.asset);
          if (treasuryWallet) {
             // Asumiendo que se llevó el dólar completo (sin referidos por simplificar rollback)
             treasuryWallet.balance = new Decimal(treasuryWallet.balance).minus(FLAT_FEE_USDT).toNumber();
             await queryRunner.manager.save(Wallet, treasuryWallet);
          }
        }

        tx.status = 'failed';
        await queryRunner.manager.save(Transaction, tx);
        await queryRunner.commitTransaction();
        return res.json({ ok: true, msg: 'Retiro rechazado. Fondos devueltos al usuario.' });
      } else {
        throw new Error('Acción no válida. Usa "approve" o "reject".');
      }

    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== DISPUTAS ====================
  static async createDispute(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { transactionId } = req.params;
      const claimantId = (req as any).user.id;
      const { reason } = req.body;

      const tx = await queryRunner.manager.findOne(Transaction, {
        where: { id: Number(transactionId) },
        relations: ['sender', 'receiver']
      });
      if (!tx) throw new Error('Transacción no encontrada.');
      if (tx.status === 'disputed') throw new Error('Esta transacción ya tiene una disputa abierta.');
      if (tx.sender.id !== claimantId && tx.receiver.id !== claimantId) {
        throw new Error('No tienes permiso para disputar esta operación.');
      }

      await TransactionController.getWalletWithLock(queryRunner, tx.receiver.id, tx.asset);
      
      tx.status = 'disputed';
      await queryRunner.manager.save(Transaction, tx);

      const newDispute = queryRunner.manager.create(Dispute, {
        transaction: tx,
        claimant_id: claimantId,
        reason: reason,
        status: 'OPEN'
      });
      await queryRunner.manager.save(Dispute, newDispute);

      await queryRunner.commitTransaction();
      res.json({ ok: true, msg: 'Disputa iniciada.', disputeId: newDispute.id });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  static async resolveDispute(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { disputeId } = req.params;
      const { resolution } = req.body; 

      const dispute = await queryRunner.manager.findOne(Dispute, {
        where: { id: Number(disputeId) },
        relations: ['transaction', 'transaction.sender', 'transaction.receiver']
      });
      if (!dispute || dispute.status !== 'OPEN') throw new Error('Disputa no válida.');

      const tx = dispute.transaction;
      const amount = new Decimal(tx.amount.toString());

      const receiverWallet = await TransactionController.getWalletWithLock(queryRunner, tx.receiver.id, tx.asset);
      const senderWallet = await TransactionController.getWalletWithLock(queryRunner, tx.sender.id, tx.asset);

      if (!receiverWallet || !senderWallet) throw new Error('Wallets no encontradas.');

      if (resolution === 'REFUND') {
        senderWallet.locked_balance = new Decimal(senderWallet.locked_balance).minus(amount).toNumber();
        senderWallet.balance = new Decimal(senderWallet.balance).plus(amount).toNumber();
        await queryRunner.manager.save(Wallet, senderWallet);
        tx.status = 'refunded';
      } else {
        senderWallet.locked_balance = new Decimal(senderWallet.locked_balance).minus(amount).toNumber();
        receiverWallet.balance = new Decimal(receiverWallet.balance).plus(amount).toNumber();
        await queryRunner.manager.save(Wallet, senderWallet);
        await queryRunner.manager.save(Wallet, receiverWallet);
        tx.status = 'completed';
      }

      dispute.status = 'RESOLVED';
      await queryRunner.manager.save(Dispute, dispute);
      await queryRunner.manager.save(Transaction, tx);
      await queryRunner.commitTransaction();
      res.json({ ok: true, msg: `Disputa resuelta como: ${resolution}` });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({ ok: false, error: err.message });
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== AUXILIARES ====================
  static async getOrderMessages(req: Request, res: Response) { res.json([]); }
  
  static async getMyTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const txs = await AppDataSource.getRepository(Transaction).find({
        where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
        order: { created_at: 'DESC' },
        relations: ['sender', 'receiver']
      });
      res.json(txs);
    } catch (error) { res.status(500).json([]); }
  }

  // ==================== PRIVADOS ====================
  private static async checkUserLimits(userId: string, amount: Decimal, queryRunner: any): Promise<void> {
    const profile = await queryRunner.manager.query(
      `SELECT region_id, kyc_level_tier FROM user_profiles WHERE user_id = $1`,
      [userId]
    );
    let limit = new Decimal(5000); // Límite por defecto asegurado
    if (profile.length > 0) {
      const { region_id, kyc_level_tier } = profile[0];
      const kycLevel = await queryRunner.manager.query(
        `SELECT daily_limit_base FROM kyc_levels WHERE region_id = $1 AND level_tier = $2`,
        [region_id, kyc_level_tier]
      );
      if (kycLevel.length > 0) {
        limit = new Decimal(kycLevel[0].daily_limit_base);
      }
    }
    const today = new Date().toISOString().split('T')[0];
    const dailyUsage = await queryRunner.manager.query(
      `SELECT SUM(amount) as total FROM transactions WHERE sender_id = $1 AND created_at >= $2 AND status = 'completed'`,
      [userId, today]
    );
    const totalToday = new Decimal(dailyUsage[0]?.total || 0);
    if (totalToday.plus(amount).greaterThan(limit)) {
      throw new Error(`Has excedido tu límite diario de ${limit.toString()} USD.`);
    }
  }

  private static async payFeeToTreasury(queryRunner: any, amount: Decimal, currency: string) {
    let treasuryUser = await queryRunner.manager.findOne(User, { where: { email: TREASURY_EMAIL } });
    if (!treasuryUser) return;
    
    let treasuryWallet = await TransactionController.getWalletWithLock(queryRunner, treasuryUser.id, currency);
    
    if (!treasuryWallet) {
      treasuryWallet = queryRunner.manager.create(Wallet, {
        user: treasuryUser,
        currency: currency,
        balance: 0,
        address: `TREASURY-${currency}`
      });
    }
    treasuryWallet.balance = new Decimal(treasuryWallet.balance).plus(amount).toNumber();
    await queryRunner.manager.save(Wallet, treasuryWallet);
  }
}