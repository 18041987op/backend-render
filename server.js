import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/supabase.js';

import toolRoutes         from './routes/tools.js';
import userRoutes         from './routes/users.js';
import loanRoutes         from './routes/loans.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes       from './routes/reports.js';
import uploadRoutes       from './routes/upload.js';
import './jobs/notificationScheduler.js';

dotenv.config();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido → ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/tools',         toolRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/loans',         loanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/upload',        uploadRoutes);

app.get('/', (req, res) => {
  res.send('✅ Backend funcionando correctamente — Supabase 🚀');
});

// ─── Startup ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
  })
  .catch((error) => {
    console.error('❌ Error al conectar a la base de datos:', error);
    process.exit(1);
  });
