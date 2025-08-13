import express from "express";
import "dotenv/config";
import cors from "cors";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.get("/", (req, res) => {
  res.send("USEDOLLARS.COM funcionando 🚀");
});

// Puerto
const port = process.env.PORT; // Fly requiere usar la variable de entorno PORT
if (!port) {
  console.error("ERROR: No se encontró process.env.PORT");
  process.exit(1); // Sale si no encuentra el puerto
}

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});

