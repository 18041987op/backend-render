import express from 'express';
import {
  getLoans,
  getLoan,
  createLoan,
  returnTool,
  getMyLoans // Importar la función correcta
} from '../controllers/loans.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

import {
  // ... existing imports like getLoans, getLoan, createLoan, returnTool, getMyLoans ...
  transferLoan // <-- AÑADIR ESTA
} from '../controllers/loans.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Ruta para ver las herramientas del usuario actual
router.get('/my-tools', getMyLoans); // Usar getMyLoans en lugar de getLoans

// Rutas para todos los préstamos
router.route('/').get(getLoans).post(createLoan);

// Rutas para un préstamo específico
router.route('/:id').get(getLoan).put(authorize('admin'), returnTool);

// Ruta para devolver una herramienta
router.put('/:id/return', returnTool);

// ---for transferring a loan ---
// Ensure the parameter name matches the controller (:id or :loanId)
router.put('/:id/transfer', protect, transferLoan); // Use protect middleware
// Consider if specific authorization is needed here, e.g., authorize('admin', 'technician')
// --- END NEW ROUTE ---

export default router;