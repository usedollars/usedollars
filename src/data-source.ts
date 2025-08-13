import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/user';
import { Wallet } from './entities/wallet';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres', // cambia según tu setup
  database: 'usedollars',
  synchronize: true,
  logging: true,
  entities: [User, Wallet],
  migrations: [],
  subscribers: [],
});

