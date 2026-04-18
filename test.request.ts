import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configuración
const SECRET = process.env.JWT_SECRET || "super_secret_usedollars_2026";
const URL = 'http://127.0.0.1:4001/api/transactions/internal-send'; // ⚠️ Asegúrate que la ruta sea correcta (quizás es /api/internal-send?)

async function testTransaction() {
  console.log("🛠️  Iniciando prueba de seguridad...");

  // 2. Generamos un Token FALSO (Simulamos ser un usuario logueado)
  const fakeUser = {
    id: "a1b2c3d4-e5f6-7890-1234-56789abcdef0", // Un UUID falso
    email: "admin@usedollars.com",
    role: "admin"
  };
  
  const token = jwt.sign(fakeUser, SECRET, { expiresIn: '1h' });
  console.log("🔑 Token Generado");

  // 3. Preparamos los datos del envío
  const bodyData = {
    receiverEmail: "destinatario@gmail.com", // Asegúrate que este email exista en tu DB o fallará
    amount: 100,
    assetType: "USDT"
  };

  // 4. Hacemos la petición al servidor
  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodyData)
    });

    const data = await response.json();
    
    console.log("\n📡 Respuesta del Servidor:");
    console.log("Status:", response.status);
    console.dir(data, { depth: null });

  } catch (error) {
    console.error("❌ Error conectando al servidor:", error);
  }
}

testTransaction();