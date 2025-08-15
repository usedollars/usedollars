import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ user });
  } catch (err: any) {
    if (err.message === "UserExists") return res.status(409).json({ error: "User already exists" });
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const token = await loginUser(req.body);
    res.status(200).json({ token });
  } catch (err: any) {
    if (err.message === "InvalidCredentials") return res.status(401).json({ error: "Invalid credentials" });
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

