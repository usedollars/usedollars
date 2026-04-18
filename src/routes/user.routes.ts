import { Router } from 'express';
import { getProfile, getDashboard } from '../controllers/user.controller';
import { PaymentMethodController } from '../controllers/paymentMethod.controller';
import { KycController } from '../controllers/kyc.controller'; // 👈 Importación añadida
import { verifyToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware'; // 👈 Asegúrate de tener este middleware

const router = Router();

// Usamos verifyToken directamente para que coincida con tu importación
router.use(verifyToken);

// --- Rutas de Perfil y Dashboard ---
router.get('/profile', getProfile);
router.get('/dashboard', getDashboard);

// --- Rutas de Cuentas Afines (Bancos y Wallets) ---
router.post('/payment-methods', PaymentMethodController.create);
router.get('/payment-methods', PaymentMethodController.getMyMethods);

// --- Rutas de Identidad (KYC) ---
// El usuario envía su solicitud para subir de nivel
router.post('/kyc-request', KycController.submitRequest);

// Ruta administrativa para que tú apruebes los niveles
router.post('/admin/approve-kyc', isAdmin, KycController.approveKyc);

export default router;