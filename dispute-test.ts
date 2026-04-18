import "reflect-metadata";
import { AppDataSource } from "./src/data-source";
import { TransactionController } from "./src/controllers/transaction.controller";
import { User } from "./src/entities/user";
import { Transaction } from "./src/entities/transaction";

async function runDispute() {
    console.log("🛠️  Iniciando Protocolo de Disputa...");

    try {
        await AppDataSource.initialize();
        console.log("📡 Conectado a la Base de Datos");

        // 1. Buscamos la transacción que acabamos de hacer (ID 3)
        // CAMBIA ESTE ID SI TU TRANSACCIÓN TIENE OTRO NÚMERO
        const TX_ID = 3; 
        
        const tx = await AppDataSource.manager.findOne(Transaction, {
            where: { id: TX_ID },
            relations: ["sender"]
        });

        if (!tx) {
            console.error("❌ No encontré la transacción. Revisa el ID.");
            return;
        }

        console.log(`🔎 Transacción encontrada: ID ${tx.id} | Monto: ${tx.amount} ${tx.asset}`);

        // 2. Simulamos la Petición (Request) como si viniera del Frontend
        // El emisor (sender) es quien reclama
        const reqMock = {
            params: { transactionId: String(TX_ID) },
            user: { id: tx.sender.id }, // El ID del usuario que reclama
            body: { reason: "El comprador no realizó la transferencia bancaria acordada." }
        };

        // 3. Simulamos la Respuesta (Response)
        const resMock = {
            json: (data: any) => console.log("✅ RESPUESTA DEL SERVIDOR:", data),
            status: (code: number) => ({
                json: (error: any) => console.log(`❌ ERROR (${code}):`, error)
            })
        };

        // 4. ¡Disparamos!
        console.log("⚖️  Abriendo disputa...");
        await TransactionController.createDispute(reqMock as any, resMock as any);

    } catch (error) {
        console.error("❌ Error fatal:", error);
    }
}

runDispute();