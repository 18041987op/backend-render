// backend/routes/upload.js
import express from 'express';
import multer from 'multer';
import { uploadToolImage } from '../controllers/upload.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Ruta para subir imagen (solo admin)
router.post(
  '/tool-image',
  protect,
  authorize('admin'),
  upload.single('image'),
  uploadToolImage
);

export default router;