import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware"; 

const router = Router();

router.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: `Bienvenido al dashboard, usuario ${(req as any).userId}` });
});

export default router;

