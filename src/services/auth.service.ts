import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { generateToken } from "../utils/jwt";

export const loginUser = async (email: string, password: string) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { email } });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Credenciales inválidas");
  }

  // Generar token JWT
  const token = generateToken({ 
    userId: user.id, 
    email: user.email 
  });

  return { user, token };
};

export const registerUser = async (email: string, password: string, name: string) => {
  const userRepository = AppDataSource.getRepository(User);
  const existingUser = await userRepository.findOne({ where: { email } });

  if (existingUser) {
    throw new Error("El usuario ya existe");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = userRepository.create({
    email,
    password: hashedPassword,
    name
  });

  await userRepository.save(user);

  // Generar token JWT para el nuevo usuario
  const token = generateToken({ 
    userId: user.id, 
    email: user.email 
  });

  return { user, token };
};

