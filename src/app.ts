import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transactionRoutes";
import userRoutes from "./routes/user.routes";
import walletRoutes from "./routes/wallet.routes";

dotenv.config();

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Servir archivos estáticos ---
app.use("/", express.static(path.join(__dirname, "public")));
app.use("/js", express.static(path.join(__dirname, "public/js")));

// --- Rutas ---
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallets", walletRoutes);

// --- JWT Config ---
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_key";

function verifyToken(req: any, res: any, next: any) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.split(" ")[1];
  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// --- Endpoint de prueba /api/dashboard ---
app.get("/api/dashboard", verifyToken, (req, res) => {
  return res.json({
    user: { id: (req as any).user.id, name: (req as any).user.name },
    usdt: { value: 36.5, country: "Venezuela" },
    balance: 33000,
    transactionsCount: 33,
    counterparties: 13,
    rating: "4.9/5",
    transactions: [
      { id: "#TX-7841", date: "22 Jul 2025", counterparty: "Carlos M.", amount: 125 },
      { id: "#TX-7840", date: "21 Jul 2025", counterparty: "Ana R.", amount: 139 },
    ],
  });
});

export default app;

