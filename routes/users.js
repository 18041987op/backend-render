import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  getUsers,
  getTechnicians,
  adminCreateUser,  // Nuevo endpoint para crear usuario por admin con activación
  activateUser, // Importamos la función de activación
  updateUserStatus,
  getUserByIdAsAdmin, // <-- NUEVO
  updateUserByAdmin   // <-- NUEVO
} from '../controllers/users.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);

// Ruta para activar la cuenta (pública)
router.post('/activate/:userId/:token', activateUser);

// Rutas protegidas
router.get('/profile', protect, getUserProfile);
router.get('/technicians', protect, getTechnicians);

// Rutas para administradores
router.get('/', protect, authorize('admin'), getUsers);
router.post('/admin/users', protect, authorize('admin'), adminCreateUser); // Nuevo endpoint para que el admin cree usuarios con activación por email

// NUEVO: Rutas para obtener y actualizar un usuario específico por Admin
router.route('/:id')
  .get(protect, authorize('admin'), getUserByIdAsAdmin)
  .put(protect, authorize('admin'), updateUserByAdmin);

// NUEVA RUTA: Para activar/desactivar un usuario (solo admin)
router.patch('/:id/status', protect, authorize('admin'), updateUserStatus);


export default router;

// <<<<<<<<<<<<------------------<<<<<<<<<<>>>>>>--------------------->>>>>>>>>>>>>>>>>>>
// import express from 'express';
// import {
//   registerUser,
//   loginUser,
//   getUserProfile,
//   getUsers,
//   getTechnicians

// } from '../controllers/users.controller.js';

// import { protect, authorize } from '../middleware/auth.middleware.js';

// const router = express.Router();

// // Rutas públicas
// router.post('/register', registerUser);
// router.post('/login', loginUser);

// // Rutas protegidas
// router.get('/profile', protect, getUserProfile);
// router.get('/technicians', protect, getTechnicians);

// // Rutas para administradores
// router.get('/', protect, authorize('admin'), getUsers);

// export default router;
