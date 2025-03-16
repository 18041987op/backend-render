import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Importar rutas (Asegurar que los nombres de los archivos sean correctos)
import toolRoutes from './routes/tools.js';
import userRoutes from './routes/users.js';
import loanRoutes from './routes/loans.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

// Inicializar Express
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Definir rutas
app.use('/api/tools', toolRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/notifications', notificationRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('✅ Backend funcionando correctamente 🚀');
});

// Conectar a la base de datos y arrancar el servidor
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
}).catch((error) => {
  console.error('❌ Error al conectar a la base de datos:', error);
});
