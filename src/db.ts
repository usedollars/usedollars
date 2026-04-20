import { Pool } from 'pg';

export const pool = new Pool({
  user: 'postgres',        
  host: 'localhost',
  database: 'usedollars', 
  password: 'ggadmin',          
  port: 5432,
});

pool.on('connect', () => {
  console.log('🔌 Conectado a la BD via SQL Puro');
});