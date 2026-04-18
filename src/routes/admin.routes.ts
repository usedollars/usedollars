import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Dispute, DisputeStatus } from "../entities/Dispute"; // Asegúrate de las mayúsculas
import { DisputeService } from "../services/disputes.service"; // 👈 Importamos el servicio
import { isAdmin } from "../middlewares/admin.middleware"; 

const adminRouter = Router();

// ❌ ELIMINADO: const disputeService = new DisputeService(AppDataSource);
// Ya no hace falta instanciarlo.

// APLICAR PROTECCIÓN GLOBAL: 
adminRouter.use(isAdmin);

/**
 * 1. LISTAR DISPUTAS ABIERTAS
 */
adminRouter.get("/disputes/open", async (req: Request, res: Response) => {
  try {
    const disputeRepository = AppDataSource.getRepository(Dispute);
    
    const openDisputes = await disputeRepository.find({
      where: { status: 'OPEN' as any }, // Forzamos el tipo si el enum da guerra
      relations: [
        "transaction", 
        "transaction.sender", 
        "transaction.receiver"
      ],
      order: { created_at: "DESC" }
    });

    res.json(openDisputes);
  } catch (error) {
    console.error("Error al obtener disputas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

/**
 * 2. RESOLVER DISPUTA (EL VEREDICTO)
 * Body: { "disputeId": 1, "decision": "RELEASE", "adminNotes": "Todo correcto" }
 * Decision debe ser: 'REFUND' (Devolver al emisor) o 'RELEASE' (Liberar al receptor)
 */
adminRouter.post("/disputes/resolve", async (req: Request, res: Response) => {
  // OJO: Cambiamos 'winner' por 'decision' para coincidir con el servicio
  const { disputeId, decision, adminNotes } = req.body;
  
  const adminId = (req as any).user.id; 

  try {
    if (!disputeId || !decision || !adminNotes) {
      return res.status(400).json({ 
        ok: false,
        message: "Faltan datos. Envía: disputeId, decision ('REFUND' o 'RELEASE') y adminNotes." 
      });
    }

    // ✅ CORRECCIÓN: Llamada estática directa (Sin 'new')
    const result = await DisputeService.resolveDispute(
      Number(disputeId),
      adminId,
      decision, // 'REFUND' | 'RELEASE'
      adminNotes
    );

    res.json({
      success: true,
      message: "Veredicto ejecutado y fondos movidos correctamente.",
      detail: result
    });

  } catch (error: any) {
    console.error("Error al resolver la disputa:", error.message);
    res.status(500).json({ 
      ok: false,
      message: error.message || "Error al procesar la resolución" 
    });
  }
});

export { adminRouter };