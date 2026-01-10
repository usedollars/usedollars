import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

// Servir los archivos estáticos (tu dashboard HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Mock: GET /api/dashboard/refresh
app.get('/api/dashboard/refresh', (req, res) => {
  const data = {
    username: 'Génesis',
    balance: 1234.56,
    wallets: [
      { id: 1, name: 'USD Wallet', currency: 'USD', amount: 1000 },
      { id: 2, name: 'Local Wallet', currency: 'DOP', amount: 5000 }
    ],
    recentTransactions: [
      { id: 1, type: 'venta', amount: 200.00, currency: 'USD', status: 'completada', createdAt: new Date().toISOString() },
      { id: 2, type: 'compra', amount: 50.00, currency: 'USD', status: 'pendiente', createdAt: new Date().toISOString() }
    ],
    timestamp: new Date().toISOString()
  };
  res.json({ ok: true, data });
});

// Mock: POST /api/transactions  (crear nueva transacción)
app.post('/api/transactions', (req, res) => {
  const { fromWalletId, toWalletId, amount, currency, note } = req.body || {};
  if (!fromWalletId || !toWalletId || !amount) {
    return res.status(400).json({ ok: false, message: 'Faltan campos: fromWalletId, toWalletId o amount' });
  }

  const tx = {
    id: Date.now(),
    fromWalletId,
    toWalletId,
    amount,
    currency: currency || 'USD',
    note: note || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // En un backend real guardarías en DB. Aquí devolvemos el objeto mock.
  return res.status(201).json({ ok: true, transaction: tx });
});

// Puerto del mock
const PORT = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 4001;
app.listen(PORT, () => {
  console.log(`Mock API corriendo en http://localhost:${PORT}  (serving static from src/public)`); 
});

