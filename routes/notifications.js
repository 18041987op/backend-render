import express from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification
} from '../controllers/notifications.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Ruta para obtener notificaciones y conteo de no leídas
router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);

// Rutas para marcar como leídas
router.put('/:id/read', markAsRead);

// Rutas para eliminar notificaciones
router.delete('/:id', deleteNotification);

export default router;
