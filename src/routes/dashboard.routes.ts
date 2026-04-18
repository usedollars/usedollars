import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware"; 
import { DashboardController } from "../controllers/dashboard.controller"; // Importa el nuevo controlador

const router = Router();

// Ahora la ruta es limpia: no necesita ID en la URL porque viene en el Token
router.get("/summary", verifyToken, DashboardController.getDashboardData);

export default router;