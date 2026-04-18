import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_usedollars_2026";

interface JwtPayload {
  id: string;
  email: string;
  role?: string;
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  
  // 1. Verificar si existe el header
  if (!authHeader) {
    return res.status(401).json({ error: "Acceso denegado. No se proporcionó token." });
  }

  // 2. Extraer el token
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Formato de token inválido. Use: Bearer <token>" });
  }

  const token = parts[1];

  try {
    // 3. Verificar la autenticidad
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // 4. Inyectar TODO el usuario en req.user
    // Esto hace compatible el middleware con: (req as any).user.id en el controlador
    (req as any).user = decoded; 

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expirado o inválido." });
  }
}