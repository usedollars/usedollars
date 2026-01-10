import express from "express";
import "dotenv/config";
import { AppDataSource } from "./data-source";
import { authRouter } from "./routes/auth.routes";
import { walletRouter } from "./routes/wallet.routes";

const app = express();
app.use(express.json());

// Rutas
app.use("/api/auth", authRouter);
app.use("/api/wallets", walletRouter);

app.get("/", (req, res) => {
  res.send("USEDOLLARS.COM funcionando 🚀");
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source initialized");

    // Solo la primera vez para arreglar tablas: borra antiguas y crea nuevas
    await AppDataSource.synchronize(true);

    app.listen(port, "0.0.0.0", () => {
      console.log(`Servidor corriendo en puerto ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error initializing Data Source:", err);
  });

