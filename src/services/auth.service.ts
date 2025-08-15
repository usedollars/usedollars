import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";

const userRepo = AppDataSource.getRepository(User);

export const registerUser = async ({ email, password, name }: { email: string; password: string; name: string }) => {
  const existing = await userRepo.findOneBy({ email });
  if (existing) throw new Error("UserExists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = userRepo.create({ email, password: hashedPassword, name, isActive: true, isVerified: false });
  await userRepo.save(user);
  return { ...user, password: undefined };
};

export const loginUser = async ({ identifier, password }: { identifier: string; password: string }) => {
  const user = await userRepo.findOneBy({ email: identifier });
  if (!user) throw new Error("InvalidCredentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("InvalidCredentials");

  // Aquí podrías generar un JWT real
  const token = "mocked-jwt-token";
  return token;
};

