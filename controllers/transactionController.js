const db = require('../db'); // Asegúrate que esto apunta a tu conexión real

const transactionController = {

    // --- 1. TRANSFERENCIAS INTERNAS (Usuario a Usuario - 0% Comisión) ---
    sendInternalAssets: async (req, res) => {
        const { senderId, receiverEmail, amount, currency } = req.body;
        
        // Validaciones rápidas
        if (!senderId || !receiverEmail || !amount || !currency) {
            return res.status(400).json({ msg: "Faltan datos requeridos" });
        }

        const client = await db.connect(); // Abrimos conexión exclusiva

        try {
            await client.query('BEGIN'); // --- INICIO TRANSACCIÓN SEGURA ---

            // A. Buscar al Receptor por Email
            const receiverRes = await client.query('SELECT id FROM users WHERE email = $1', [receiverEmail]);
            if (receiverRes.rows.length === 0) throw new Error('Usuario destinatario no encontrado');
            const receiverId = receiverRes.rows[0].id;

            if (senderId === receiverId) throw new Error('No puedes enviarte dinero a ti mismo');

            // B. Buscar y BLOQUEAR Billetera del Remitente (Sender)
            // "FOR UPDATE" impide que gaste el dinero dos veces al mismo tiempo
            const senderWalletRes = await client.query(
                `SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE`,
                [senderId, currency]
            );

            if (senderWalletRes.rows.length === 0) throw new Error('No tienes billetera en esta moneda');
            const senderWallet = senderWalletRes.rows[0];

            // C. Verificar si tiene fondos suficientes
            if (parseFloat(senderWallet.balance) < parseFloat(amount)) {
                throw new Error('Saldo insuficiente');
            }

            // D. Buscar Billetera del Receptor
            const receiverWalletRes = await client.query(
                `SELECT id FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE`,
                [receiverId, currency]
            );
            
            // Nota: Aquí podrías crear la billetera si no existe, pero por seguridad lanzamos error por ahora
            if (receiverWalletRes.rows.length === 0) throw new Error('El destinatario no tiene billetera habilitada para esta moneda');
            const receiverWallet = receiverWalletRes.rows[0];

            // --- E. MOVIMIENTO DE DINERO ---
            
            // 1. Restar al que envía
            await client.query(
                `UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2`,
                [amount, senderWallet.id]
            );

            // 2. Sumar al que recibe
            await client.query(
                `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
                [amount, receiverWallet.id]
            );

            // 3. Guardar en el Historial (Salida)
            await client.query(
                `INSERT INTO transactions (wallet_id, type, amount, balance_after, description, reference_id)
                 VALUES ($1, 'INTERNAL_SEND', $2, $3, $4, $5)`,
                [senderWallet.id, amount, parseFloat(senderWallet.balance) - parseFloat(amount), `Envío a ${receiverEmail}`, receiverId]
            );

            // 4. Guardar en el Historial (Entrada)
            await client.query(
                `INSERT INTO transactions (wallet_id, type, amount, balance_after, description, reference_id)
                 VALUES ($1, 'INTERNAL_RECEIVE', $2, (SELECT balance FROM wallets WHERE id = $1), $3, $4)`,
                [receiverWallet.id, amount, `Recibido de Usuario ${senderId}`, senderId]
            );

            await client.query('COMMIT'); // --- FINALIZAR (Guardar cambios) ---

            res.json({ msg: "Envío exitoso", amount, currency });

        } catch (error) {
            await client.query('ROLLBACK'); // Si algo falla, deshacemos todo
            console.error(error);
            res.status(400).json({ msg: error.message || "Error en transferencia" });
        } finally {
            client.release(); // Soltar conexión
        }
    },

    // --- 2. CREAR DISPUTA (Cuando falla un P2P) ---
    createDispute: async (req, res) => {
        const { transactionId } = req.params; 
        const { reason, claimantId } = req.body;

        try {
            // Guardamos la queja en la tabla 'disputes' que acabamos de crear
            const result = await db.query(
                `INSERT INTO disputes (transaction_id, claimant_id, reason) 
                 VALUES ($1, $2, $3) RETURNING *`,
                [transactionId, claimantId, reason]
            );

            // Marcamos la transacción original como "DISPUTED"
            await db.query(
                `UPDATE transactions SET status = 'DISPUTED' WHERE id = $1`,
                [transactionId]
            );

            res.status(201).json({ 
                msg: "Disputa creada. Soporte revisará el caso.", 
                dispute: result.rows[0] 
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error al crear disputa. Verifica el ID de transacción." });
        }
    },
    
    // --- 3. REFERIDOS (Placeholder) ---
    getReferralStats: async (req, res) => {
        res.json({ msg: "Estadísticas de referidos (Pendiente de lógica SQL)" });
    }
};

module.exports = transactionController;