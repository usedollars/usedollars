import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PaymentMethod } from "../entities/paymentMethod";

export class PaymentMethodController {
  
  // Guardar un nuevo método (Blindado por el usuario logueado)
  static async create(req: Request, res: Response) {
    const { bankName, accountDetails, type } = req.body;
    const userId = (req as any).user.id; // Obtenido del JWT

    try {
      const pmRepo = AppDataSource.getRepository(PaymentMethod);
      const newMethod = pmRepo.create({
        bankName,
        accountDetails,
        type,
        user: { id: userId } as any
      });

      await pmRepo.save(newMethod);
      res.status(201).json({ ok: true, message: "Método de cobro vinculado correctamente." });
    } catch (error) {
      res.status(500).json({ message: "Error al guardar el método de cobro." });
    }
  }

  // Obtener solo los métodos del usuario logueado
  static async getMyMethods(req: Request, res: Response) {
    const userId = (req as any).user.id;

    try {
      const pmRepo = AppDataSource.getRepository(PaymentMethod);
      const methods = await pmRepo.find({
        where: { user: { id: userId } },
        order: { created_at: "DESC" }
      });
      res.json(methods);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener métodos." });
    }
  }
}