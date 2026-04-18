import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

// --- IMPORTS DE RUTAS ---
import authRoutes from "./routes/auth.routes"; 
import { transactionRouter } from "./routes/transactionRoutes"; // 👈 Importación nombrada
import userRoutes from "./routes/user.routes"; 
import { walletRouter } from "./routes/wallet.routes"; 

dotenv.config();

const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARES ---
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- SERVIR ARCHIVOS ESTÁTICOS ---
app.use("/", express.static(path.join(__dirname, "public")));
app.use("/js", express.static(path.join(__dirname, "public/js")));

// --- RUTAS DE LA API ---
app.use("/api/auth", authRoutes);
app.use("/transactions", transactionRouter); // Montado en /transactions
app.use("/api/users", userRoutes);
app.use("/wallets", walletRouter); 

// --- ENDPOINT DE SALUD ---
app.get("/", (req, res) => {
    res.json({ 
        status: "Online", 
        service: "UseDollars API",
        time: new Date().toISOString()
    });
});

// Log para verificar que las rutas se cargaron
console.log('Rutas registradas:');
app._router.stack.forEach((layer: any) => {
  if (layer.route) {
    console.log(`${Object.keys(layer.route.methods)} ${layer.route.path}`);
  } else if (layer.name === 'router') {
    console.log(`Router montado en: ${layer.regexp}`);
  }
});

export default app;