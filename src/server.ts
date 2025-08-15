import express from 'express';
import 'reflect-metadata';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import { AppDataSource } from './data-source';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.use('/api/auth', authRoutes);

// Inicializar Data Source y levantar servidor
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source initialized');
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al inicializar Data Source:', error);
  });

