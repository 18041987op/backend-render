// backend/routes/reports.js
import express from 'express';
// Import both controller functions
import {
  getLateReturnsByTechnician,
  getDamagedReturnsByTechnician // Make sure this is imported
} from '../controllers/reports.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All report routes require admin access
router.use(protect);
router.use(authorize('admin'));

// Route for late returns report
router.get('/late-returns-by-technician', getLateReturnsByTechnician);

// Route for damaged returns report
router.get('/damaged-returns-by-technician', getDamagedReturnsByTechnician); // <-- AÑADIR/DESCOMENTAR ESTA LÍNEA

export default router;