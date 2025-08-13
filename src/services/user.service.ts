import { AppDataSource } from '../data-source';
import { User } from '../entities/user';
import { Wallet } from '../entities/wallet';
import bcrypt from 'bcryptjs';

const userRepository = AppDataSource.getRepository(User);

export const createUser = async (data: { name: string, email: string, phoneNumber: string, password: string }) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = userRepository.create({
    ...data,
    password: hashedPassword,
    isVerified: false,
    isActive: true,
  });

  await userRepository.save(user);
  return user;
};

