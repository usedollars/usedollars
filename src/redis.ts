import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Creamos la instancia usando las variables del .env
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // Esto es para que no se rinda si la conexión parpadea
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
});

// Escuchar eventos para saber qué está pasando
redis.on('connect', () => {
  console.log('🚀 Conectado a Redis en Ubuntu - Listo para Usedollars');
});

redis.on('error', (err) => {
  console.error('❌ Error de conexión en Redis:', err.message);
});

export default redis;