import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { KycLevel } from '../entities/KycLevel';

export class KycController {
  static async submitRequest(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const { fullName, documentId } = req.body;

    try {
      const userRepo = AppDataSource.getRepository(User);
      await userRepo.update(userId, {
        fullName,
        documentId,
        kycStatus: 'PENDING'
      });

      res.json({ ok: true, message: "Solicitud enviada al Tribunal de Usedollars." });
    } catch (error) {
      res.status(500).json({ message: "Error al procesar solicitud" });
    }
  }

  // Lógica de aprobación (Solo para ti como ADMIN)
  static async approveKyc(req: Request, res: Response) {
    const { userIdToApprove, tierLevel } = req.body;

    try {
      const userRepo = AppDataSource.getRepository(User);
      const levelRepo = AppDataSource.getRepository(KycLevel);

      // Buscamos el nivel en tu tabla kyc_levels
      const level = await levelRepo.findOneBy({ level_tier: tierLevel });
      
      if (!level) return res.status(404).json({ message: "Nivel de KYC no configurado" });

      await userRepo.update(userIdToApprove, {
        kycTier: tierLevel,
        kycStatus: 'APPROVED',
        kycLevel: level // Aquí vinculamos la entidad que creaste
      });

      res.json({ ok: true, message: "Usuario elevado de nivel legalmente." });
    } catch (error) {
      res.status(500).json({ message: "Error en la aprobación" });
    }
  }
}