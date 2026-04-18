import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: number;
  role: string;
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Obtener el token del header (Bearer TOKEN)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No se proporcionó un token de acceso." });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key") as TokenPayload;

    // 3. ¡LA CLAVE!: Verificar si es ADMIN
    // En tu base de datos, el campo 'role' debe ser 'ADMIN' para que esto pase.
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ 
        message: "Acceso denegado: Se requieren permisos de administrador para esta acción." 
      });
    }

    // 4. Guardar los datos en el request para que el controlador los use
    (req as any).user = decoded;

    next(); // Si todo está bien, pasamos a la ruta
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
};