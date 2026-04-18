import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { OrderController } from '../controllers/order.controller'; 
import { validateInternalTransfer } from '../middlewares/transactionValidation';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// ==================================================================
// 1. MOTOR P2P (El Flujo Principal del Diagrama)
// ==================================================================

// PASO 1: "Abre una mini página / Crear Operación"
// Esta es la ruta MAESTRA. Decide si crea orden o hace match inmediato.
// Frontend: Llamar a esto cuando el usuario le da a "Comprar/Vender".
router.post('/p2p/initiate', verifyToken, TransactionController.initiateP2P);

// Alias útiles (opcional, apuntan a lo mismo si quieres diferenciar en frontend)
router.post('/quick-buy', verifyToken, TransactionController.initiateP2P);
router.post('/p2p/trade', verifyToken, TransactionController.initiateP2P);

// PASO 2: "Espera" / Polling de estado
// Frontend: Si initiateP2P devolvió 'OPEN', llama a esto cada 3s para ver si ya hay match.
router.get('/order/:id', verifyToken, TransactionController.getOrderStatus);

// PASO 3: Chat y Comunicación
// Frontend: Para cargar los mensajes del chat cuando el estado es 'WAITING_PAYMENT'.
router.get('/order/:orderId/messages', verifyToken, TransactionController.getOrderMessages);

// PASO 4: Flujo de Pago
// Frontend: El Comprador llama a esto al dar click en "Ya pagué".
router.post('/p2p/mark-payment-sent', verifyToken, TransactionController.markPaymentSent);

// PASO 5: Liberación
// Frontend: El Vendedor llama a esto para liberar los fondos.
router.post('/p2p/confirm-payment', verifyToken, TransactionController.confirmPaymentReceived);

// [NUEVO] PASO 6: Cancelaciones P2P de Emergencia
// Frontend: Para cancelar una orden pública que aún nadie ha tomado.
router.post('/p2p/cancel/:orderId', verifyToken, TransactionController.cancelP2POrder);
// Frontend: Para cancelar un comercio donde el comprador nunca envió el pago.
router.post('/p2p/cancel-timeout/:transactionId', verifyToken, TransactionController.cancelOrderForNonPayment);


// ==================================================================
// 2. MERCADO P2P (Listado Manual)
// ==================================================================

// Ver la lista de órdenes pendientes (para quien quiera elegir manualmente)
router.get('/p2p/open-orders', verifyToken, TransactionController.getOpenOrders);

// Tomar una orden específica de la lista (Match Manual)
router.post('/p2p/accept', verifyToken, TransactionController.acceptOrder);

// Nota: Si usas initiateP2P para todo, quizás no necesites OrderController, 
// pero lo dejo por si tienes una lógica separada para "Publicar Anuncio".
router.post('/create-order', verifyToken, OrderController.createOrder);


// ==================================================================
// 3. BILLETERA (Depósitos, Retiros y Transferencias)
// ==================================================================

// Transferencias Internas (User a User dentro de la App)
router.post('/internal-send', verifyToken, validateInternalTransfer, TransactionController.sendInternalAssets);

// Depósitos (Recibir Cripto externa)
router.post('/deposit/address', verifyToken, TransactionController.getDepositAddress);
router.post('/deposit/notify', verifyToken, TransactionController.simulateDeposit); // Webhook o simulación

// Retiros (Enviar a Blockchain externa)
router.post('/withdraw/external', verifyToken, TransactionController.withdrawToExternal);

// [NUEVO] Procesamiento de Retiros (Solo ADMIN)
// Nota: Deberías agregar un middleware como 'verifyAdmin' en el futuro si tienes uno creado.
router.post('/withdraw/external/:transactionId/process', verifyToken, TransactionController.processExternalWithdrawal);


// ==================================================================
// 4. SEGURIDAD Y DISPUTAS
// ==================================================================

// Crear una disputa (cuando algo sale mal en el P2P)
router.post('/:transactionId/dispute', verifyToken, TransactionController.createDispute);

// Resolver disputa (Solo Admins deberían tener acceso a esto, verifica tus middlewares)
router.post('/disputes/:disputeId/resolve', verifyToken, TransactionController.resolveDispute);


// ==================================================================
// 5. CONSULTAS GENERALES
// ==================================================================

// Historial de transacciones del usuario
router.get('/me', verifyToken, TransactionController.getMyTransactions);


export const transactionRouter = router;