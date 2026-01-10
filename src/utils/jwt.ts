import jwt from 'jsonwebtoken';

// Asegurarnos de que las variables estén cargadas
if (!process.env.JWT_SECRET) {
    // Intentar cargar dotenv directamente como último recurso
    require('dotenv').config();
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está definida en las variables de entorno');
}

export interface JwtPayload {
    userId: number;
    email: string;
}

export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
};

export const verifyToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        throw new Error('Token inválido o expirado');
    }
};
