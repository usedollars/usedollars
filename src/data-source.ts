import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/user";       
import { Transaction } from "./entities/transaction";
import { Wallet } from "./entities/wallet";
import { UserProfile } from "./entities/UserProfile";
import { KycLevel } from "./entities/KycLevel";   
import { Dispute } from "./entities/Dispute";
import { PaymentMethod } from "./entities/paymentMethod";
import { Message } from "./entities/Message"; 
import { Order } from "./entities/order";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "ggadmin", // Mantén tu clave aquí
    database: "usedollars",
    synchronize: true, // Esto creará la tabla 'messages' automáticamente al reiniciar
    logging: false,
    entities: [
        User, 
        Transaction, 
        Wallet,
        Dispute,
        UserProfile,
        KycLevel,
        PaymentMethod,
        Message,
        Order 
    ],
    migrations: [],
    subscribers: [],
});