import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message";

export class ChatController {
  
  /**
   * OBTIENE EL HISTORIAL DE CHAT
   * Responde a la función fetchChatHistory de tu OrderChat.tsx
   */
  static async getOrderMessages(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const messageRepo = AppDataSource.getRepository(Message);

      // Buscamos los mensajes de la orden y traemos al emisor (sender)
      const messages = await messageRepo.find({
        where: { order: { id: Number(orderId) } },
        order: { created_at: 'ASC' }, // Orden cronológico
        relations: ['sender']
      });

      // Mapeamos los datos para que el frontend reciba lo que espera: content, senderId, etc.
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender.id,
        created_at: msg.created_at
      }));

      return res.json(formattedMessages);
    } catch (error) {
      console.error("Error al cargar el chat:", error);
      return res.status(500).json({ 
        ok: false, 
        message: "Error interno al cargar el historial de mensajes." 
      });
    }
  }
}