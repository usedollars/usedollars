import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/user';

const userRepository = AppDataSource.getRepository(User);

export const register = async (req: Request, res: Response) => {
  const { name, email, phoneNumber, password } = req.body;

  const existingUser = await userRepository.findOne({
    where: [{ email }, { phoneNumber }]
  });

  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = userRepository.create({
    name,
    email,
    phoneNumber,
    password,
    isVerified: false,
    isActive: true
  });

  await userRepository.save(user);
  res.status(201).json(user);
};

export const login = async (req: Request, res: Response) => {
  res.send('Login logic here');
};

