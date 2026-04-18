import { Server } from "socket.io"; // Asumiendo que usarás Socket.io

export class NotificationService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // Notificar al comprador que el vendedor bloqueó los fondos
  async notifyFundsLocked(buyerId: number, transactionId: number, amount: number, asset: string) {
    const message = `¡Buenas noticias! El vendedor ha bloqueado ${amount} ${asset.toUpperCase()}. Ya puedes realizar el pago de forma segura.`;
    
    // Enviar vía WebSocket (Tiempo real)
    this.io.to(`user_${buyerId}`).emit("notification", {
      type: "FUNDS_LOCKED",
      transactionId,
      message
    });

    console.log(`Notificación enviada al usuario ${buyerId}: Fondos bloqueados.`);
    // Aquí podrías llamar a un servicio de Email (Nodemailer)
  }

  // Notificar al vendedor que el comprador marcó como pagado
  async notifyPaymentSent(sellerId: number, transactionId: number) {
    const message = `El comprador ha marcado la transacción #${transactionId} como pagada. Por favor, verifica tu cuenta bancaria y libera los fondos.`;
    
    this.io.to(`user_${sellerId}`).emit("notification", {
      type: "PAYMENT_SENT",
      transactionId,
      message
    });
  }

  // Notificar resolución de disputa
  async notifyDisputeResolved(userId: number, transactionId: number, won: boolean) {
    const message = won 
      ? `La disputa de la transacción #${transactionId} ha sido resuelta a tu favor. Los fondos han sido acreditados.`
      : `La disputa de la transacción #${transactionId} ha sido resuelta. Los fondos han sido devueltos a la contraparte.`;

    this.io.to(`user_${userId}`).emit("notification", {
      type: "DISPUTE_RESOLVED",
      transactionId,
      message
    });
  }
}