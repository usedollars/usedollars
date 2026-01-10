import express from 'express';
import cors from 'cors';
import walletRoutes from './routes/wallet.routes';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/wallets', walletRoutes);

app.listen(4001, () => {
  console.log('Servidor corriendo en puerto 4001');
});

