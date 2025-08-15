import express from "express";
import "dotenv/config";

const app = express();

// Middlewares
app.use(express.json());

// Rutas
app.get("/", (req, res) => {
  res.send("USEDOLLARS.COM funcionando 🚀");
});

// Puerto asignado por Fly (fallback 3000 local)
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});

