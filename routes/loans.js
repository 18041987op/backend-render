import express from 'express';
import {
  getLoans,
  getLoan,
  createLoan,
  returnTool,
  getMyLoans // Importar la función correcta
} from '../controllers/loans.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

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

export default router;