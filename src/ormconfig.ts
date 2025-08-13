import { createConnection } from "typeorm";
import { User } from "./entities/user";

export const connectDB = async () => {
  await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "gg", // <- el usuario de tu PostgreSQL
    password: "MillonetaBillons",   // <- si no tiene contraseña, déjalo así
    database: "usedollars",
    entities: [User],
    synchronize: true,
    logging: true,
  });
};

