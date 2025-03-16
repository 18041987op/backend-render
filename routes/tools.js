import express from 'express';
import {
  getTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  updateToolStatus
} from '../controllers/tools.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Ruta de herramientas funcionando' });
});

// Todas las rutas requieren autenticación
router.use(protect);

// Ruta para obtener todas las herramientas y crear una nueva
router.route('/').get(getTools).post(authorize('admin'), createTool);

// Ruta para actualizar solo el estado de una herramienta
router.patch('/:id/status', authorize('admin'), updateToolStatus);

// Rutas para una herramienta específica
router.route('/:id').get(getTool).put(authorize('admin'), updateTool).delete(authorize('admin'), deleteTool);

export default router;
