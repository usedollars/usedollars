import { getRepository } from 'typeorm';
import { User } from "../entities/user";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export async function loginUser(email: string, password: string) {
  const userRepository = getRepository(User);
  const user = await userRepository.findOne({ where: { email } });

  if (!user) throw new Error('Usuario no encontrado');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Contraseña incorrecta');

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { token, user };
}

