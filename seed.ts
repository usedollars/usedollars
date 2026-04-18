import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configuración
const SECRET = process.env.JWT_SECRET || "super_secret_usedollars_2026";
// Asegúrate de que esta URL coincida con tu index.ts (api/transactions + internal-send)
const URL = 'http://127.0.0.1:4001/api/transactions/internal-send'; 

async function testTransaction() {
  console.log("🛠️  Iniciando prueba de seguridad...");

  // 2. Generamos un Token con TU ID REAL (El que salió del Seed)
  const fakeUser = {
    id: "a5ded2f5-46f9-430d-9353-2022a5abe6af", // 👈 TU ID DEL EMISOR
    email: "admin@usedollars.com",
    role: "admin"
  };
  
  const token = jwt.sign(fakeUser, SECRET, { expiresIn: '1h' });
  console.log("🔑 Token Generado");

  // 3. Preparamos los datos del envío (Al amigo receptor)
  const bodyData = {
    receiverEmail: "amigo@gmail.com", 
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

    const textResponse = await response.text();
    console.log("\n📡 Respuesta del Servidor:");
    
    try {
        const data = JSON.parse(textResponse);
        console.dir(data, { depth: null });
    } catch {
        console.log(textResponse);
    }

  } catch (error) {
    console.error("❌ Error conectando al servidor:", error);
  }
}

testTransaction();