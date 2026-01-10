import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Wallet } from "./entities/Wallet";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // solo en dev
  logging: true,
  entities: [User, Wallet],
  migrations: [],
  subscribers: [],
});

