import "reflect-metadata"; 
import express from "express";
import cors from "cors"; 
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { AppDataSource } from "./data-source";
import { Message } from "./entities/Message";
import './redis'; // Conexión a Redis en Ubuntu

// --- IMPORTACIÓN DE RUTAS ---
import { authRouter } from "./routes/auth.routes";
import { walletRouter } from "./routes/wallet.routes";
import { transactionRouter } from "./routes/transactionRoutes"; 
import { adminRouter } from "./routes/admin.routes";
import userRouter from "./routes/user.routes"; 

const app = express();
const httpServer = createServer(app);

// Configuración de Sockets
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.set("socketio", io);
app.use(cors()); 
app.use(express.json());

// --- REGISTRO DE RUTAS ---
app.use("/auth", authRouter);
app.use("/wallets", walletRouter);
app.use("/transactions", transactionRouter); 
app.use("/admin", adminRouter);
app.use("/users", userRouter); 

// Ruta de estado
app.get("/", (req, res) => {
  res.send("USEDOLLARS.COM P2P Engine Online 🚀");
});

// --- LÓGICA DE SOCKETS (Chat y Control de Administradora) ---
io.on("connection", (socket) => {
  
  // Usuario o Admin se unen a la sala de su transacción
  socket.on("join_room", (id: string) => {
    socket.join(id);
    console.log(`📡 Socket ${socket.id} unido a la Orden: ${id}`);
  });

  // Evento de envío de mensaje con flag de Admin
  socket.on("send_message", async (data: { 
    orderId: number, 
    senderId: number, 
    content: string,
    isAdmin?: boolean 
  }) => {
    try {
      const messageRepo = AppDataSource.getRepository(Message);
      
      // 1. Persistencia en DB
      const newMessage = messageRepo.create({
        content: data.content,
        order: { id: data.orderId } as any,
        sender: { id: data.senderId } as any,
        is_admin_note: data.isAdmin || false 
      });
      
      await messageRepo.save(newMessage);

      console.log(`📩 Mensaje [Order:${data.orderId}] de User:${data.senderId} ${data.isAdmin ? '(ADMIN)' : ''}`);

      // 2. Retransmitir a todos en la sala
      io.to(data.orderId.toString()).emit("receive_message", {
        id: newMessage.id,
        content: newMessage.content,
        senderId: data.senderId,
        isAdmin: data.isAdmin || false,
        created_at: newMessage.created_at
      });

    } catch (error) {
      console.error("❌ Error en persistencia de chat:", error);
      socket.emit("error_message", "No se pudo guardar el mensaje");
    }
  });

  socket.on("disconnect", () => {
    console.log("👤 Usuario desconectado");
  });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 4001; 

// --- INICIALIZACIÓN ---
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Base de Datos PostgreSQL conectada (Usedollars)");
    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Servidor P2P Global corriendo en puerto: ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error fatal en DB:", err);
    process.exit(1);
  });

export { io };