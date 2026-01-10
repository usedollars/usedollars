const { Transaction, Wallet } = require('../models');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class TransactionController {
  
  // Crear nueva transacción
  async createTransaction(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { wallet_id, type, amount, description, metadata } = req.body;
      
      // Validaciones básicas
      if (!wallet_id || !type || !amount) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Campos requeridos: wallet_id, type, amount'
        });
      }

      if (amount <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'El monto debe ser mayor a 0'
        });
      }

      // Verificar que la wallet existe
      const wallet = await Wallet.findByPk(wallet_id, { transaction });
      if (!wallet) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Wallet no encontrada'
        });
      }

      // Calcular comisión (ejemplo: 2% para depósitos, 1% para retiros)
      const commissionRates = {
        deposit: 0.02,    // 2%
        withdrawal: 0.01, // 1%
        transfer: 0.015,  // 1.5%
        fee: 0.00        // 0%
      };

      const commissionRate = commissionRates[type] || 0.00;
      const commission = amount * commissionRate;
      const netAmount = amount - commission;

      // Validar fondos para retiros/transferencias
      if (type === 'withdrawal' || type === 'transfer') {
        if (wallet.balance < amount) {
          await transaction.rollback();
          return res.status(400).json({
            error: 'Fondos insuficientes'
          });
        }
      }

      // Actualizar balance de la wallet
      if (type === 'deposit') {
        wallet.balance = Number(wallet.balance) + netAmount;
      } else if (type === 'withdrawal' || type === 'transfer') {
        wallet.balance = Number(wallet.balance) - amount;
      }

      await wallet.save({ transaction });

      // Crear la transacción
      const newTransaction = await Transaction.create({
        wallet_id,
        type,
        amount: Number(amount),
        commission: Number(commission),
        net_amount: Number(netAmount),
        description,
        status: 'completed',
        reference: `TX-${uuidv4().split('-')[0].toUpperCase()}`,
        metadata: metadata || {}
      }, { transaction });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Transacción completada exitosamente',
        transaction: newTransaction
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error en transacción:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener transacciones por wallet
  async getTransactionsByWallet(req, res) {
    try {
      const { wallet_id } = req.params;
      const { page = 1, limit = 10, type } = req.query;

      // Validar que la wallet existe
      const wallet = await Wallet.findByPk(wallet_id);
      if (!wallet) {
        return res.status(404).json({
          error: 'Wallet no encontrada'
        });
      }

      // Construir condiciones de búsqueda
      const whereConditions = { wallet_id };
      if (type) {
        whereConditions.type = type;
      }

      const offset = (page - 1) * limit;

      const transactions = await Transaction.findAndCountAll({
        where: whereConditions,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset,
        include: [{
          model: Wallet,
          as: 'wallet',
          attributes: ['id', 'user_id', 'balance', 'currency']
        }]
      });

      res.json({
        success: true,
        data: transactions.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(transactions.count / limit),
          total_items: transactions.count,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      
      res.status(500).json({
        error: 'Error obteniendo transacciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener transacción específica
  async getTransactionById(req, res) {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findByPk(id, {
        include: [{
          model: Wallet,
          as: 'wallet',
          attributes: ['id', 'user_id', 'balance', 'currency']
        }]
      });

      if (!transaction) {
        return res.status(404).json({
          error: 'Transacción no encontrada'
        });
      }

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('Error obteniendo transacción:', error);
      
      res.status(500).json({
        error: 'Error obteniendo transacción'
      });
    }
  }
}

module.exports = new TransactionController();
