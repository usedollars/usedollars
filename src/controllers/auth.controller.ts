import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/user"; 
import { Wallet } from "../entities/wallet";
import { KycLevel } from "../entities/KycLevel"; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// --- REGISTRO DE SOCIOS ---
export const register = async (req: Request, res: Response): Promise<any> => {
  const { name, email, password, referredBy } = req.body;

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userRepository = queryRunner.manager.getRepository(User);
    const kycRepository = queryRunner.manager.getRepository(KycLevel);
    
    // 1. Verificamos si el expediente del correo ya existe
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ message: "El correo ya está registrado en el búnker." });
    }

    // 2. LÓGICA DE REFERIDOS (Buscamos al Padrino real)
    let referrerUser = null;
    if (referredBy) { // referredBy llega como string desde el frontend (ej: "8XJ2P")
      referrerUser = await userRepository.findOne({ where: { refCode: referredBy } });
      
      if (!referrerUser) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({ message: "El código de invitación ingresado no existe o no es válido." });
      }
    }

    // 3. Buscamos el Nivel Base (Tier 0) para el nuevo socio
    const baseLevel = await kycRepository.findOne({ where: { level_tier: 0 } });

    // 4. Seguridad: Encriptamos la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Generamos un código limpio, aleatorio y sin prefijos (8 caracteres)
    const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 6. Creamos la identidad del usuario con Tier 0 y su Referral Code
    const newUser = userRepository.create({
      name,
      email,
      password: hashedPassword,
      referredBy: referrerUser, // Aquí guardamos la relación real, no el texto
      refCode: randomCode, 
      kycTier: 0, 
      kycStatus: 'PENDING_VERIFICATION',
      kycLevel: baseLevel || undefined 
    });

    const savedUser = await userRepository.save(newUser);

    // 7. CREACIÓN DE BILLETERAS INICIALES (USDT por defecto)
    const walletRepository = queryRunner.manager.getRepository(Wallet);
    const generatedAddress = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const newWallet = walletRepository.create({
      user: savedUser,
      balance: 0,
      currency: "USDT",
      address: generatedAddress 
    });

    await walletRepository.save(newWallet);

    await queryRunner.commitTransaction();
    return res.status(201).json({ 
      ok: true,
      message: "Registro exitoso. Bienvenido a la Legión.",
      refCode: newUser.refCode 
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Error en registro:", error);
    return res.status(500).json({ message: "Error al procesar el registro." });
  } finally {
    await queryRunner.release();
  }
};

// --- INICIO DE SESIÓN ---
export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Buscamos al usuario incluyendo sus relaciones para el Sidebar
    const user = await userRepository.createQueryBuilder("user")
      .where("user.email = :email", { email })
      .addSelect("user.password") 
      .leftJoinAndSelect("user.kycLevel", "kycLevel") 
      .getOne();

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Contraseña incorrecta." });
    }

    // Generamos el pasaporte digital (Token)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secreto_del_bunker",
      { expiresIn: "24h" }
    );

    // DEVOLVEMOS TODO LO QUE EL SIDEBAR NECESITA
    return res.status(200).json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        refCode: user.refCode, 
        kycTier: user.kycTier, 
        kycStatus: user.kycStatus 
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};