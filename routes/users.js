import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  getUsers,
  getTechnicians
} from '../controllers/users.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas protegidas
router.get('/profile', protect, getUserProfile);
router.get('/technicians', protect, getTechnicians);

// Rutas para administradores
router.get('/', protect, authorize('admin'), getUsers);

export default router;
