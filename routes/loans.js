import express from 'express';
import {
  getLoans,
  getLoan,
  createLoan,
  returnTool,
  getMyLoans,
  transferLoan,
} from '../controllers/loans.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Herramientas prestadas al usuario autenticado
router.get('/my-tools', getMyLoans);

// Listado y creación de préstamos
router.route('/').get(getLoans).post(createLoan);

// Detalle de un préstamo (GET) y devolución por admin (PUT)
router.route('/:id').get(getLoan).put(authorize('admin'), returnTool);

// Devolución estándar (técnico o admin)
router.put('/:id/return', returnTool);

// Transferencia entre técnicos
router.put('/:id/transfer', transferLoan);

export default router;