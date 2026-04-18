import { pool } from '../db';

export class WalletService {
  
  // 1. Obtener Billeteras (Aquí es donde buscamos los millones)
  async getMyWallets(userId: string) {
    // ESTAS LÍNEAS SON PARA SABER QUÉ PASA:
    console.log("-----------------------------------------");
    console.log("EL BACKEND ESTÁ BUSCANDO AL USUARIO ID:", userId);
    
    const query = 'SELECT * FROM wallets WHERE user_id = $1::integer';
    const result = await pool.query(query, [userId]);
    
    console.log("BILLETERAS ENCONTRADAS EN BD:", result.rows.length);
    if (result.rows.length > 0) {
      console.log("SALDO ENCONTRADO:", result.rows[0].balance);
    }
    console.log("-----------------------------------------");

    return result.rows; 
  }

  // 2. Crear Billetera (Para usuarios nuevos)
  async createWallet(userId: string, currency: string) {
    // Verificamos si ya existe para no duplicar
    const check = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1::integer AND currency = $2',
      [userId, currency]
    );

    if (check.rows.length > 0) {
      throw new Error(`La billetera de ${currency} ya existe.`);
    }

    // Insertamos (Empieza en 0.00)
    const query = `
      INSERT INTO wallets (user_id, currency, balance)
      VALUES ($1::integer, $2, 0.00)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, currency]);
    return result.rows[0];
  }

  // 3. Transferir (Lógica de transacción)
  async transfer(data: { fromUserId: string, toUserEmail: string, amount: number, currency: string }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN'); // Iniciamos transacción segura

      // A. Buscar destinatario
      const userRes = await client.query('SELECT id FROM users WHERE email = $1', [data.toUserEmail]);
      if (userRes.rows.length === 0) throw new Error('Usuario destinatario no encontrado');
      const toUserId = userRes.rows[0].id;

      // B. Verificar saldo del remitente
      const walletRes = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1::integer AND currency = $2',
        [data.fromUserId, data.currency]
      );
      
      if (walletRes.rows.length === 0) throw new Error('No tienes billetera de esta moneda');
      const currentBalance = Number(walletRes.rows[0].balance);

      if (currentBalance < data.amount) throw new Error('Fondos insuficientes');

      // C. Descontar dinero (Resta)
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2::integer AND currency = $3',
        [data.amount, data.fromUserId, data.currency]
      );

      // D. Acreditar dinero (Suma)
      // Primero verificamos si el destino tiene wallet, si no, la creamos
      const destWallet = await client.query(
        'SELECT * FROM wallets WHERE user_id = $1::integer AND currency = $2',
        [toUserId, data.currency]
      );

      if (destWallet.rows.length === 0) {
        await client.query(
          'INSERT INTO wallets (user_id, currency, balance) VALUES ($1::integer, $2, $3)',
          [toUserId, data.currency, data.amount]
        );
      } else {
        await client.query(
          'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2::integer AND currency = $3',
          [data.amount, toUserId, data.currency]
        );
      }

      await client.query('COMMIT'); // Guardamos cambios
      return { success: true, amount: data.amount, currency: data.currency };

    } catch (e) {
      await client.query('ROLLBACK'); // Si algo falla, deshacemos todo
      throw e;
    } finally {
      client.release();
    }
  }
}