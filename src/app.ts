import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";

const app = express();

// ===== Middlewares =====
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// ===== Rutas =====
app.use("/api/auth", authRoutes);

// Endpoint de salud
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "usedollars",
    ts: new Date().toISOString()
  });
});

export default app; 
