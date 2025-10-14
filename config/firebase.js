// backend/config/firebase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseApp;

try {
  // Leer el archivo de credenciales
  const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '..', 'serviceAccountKey.json'), 'utf8')
  );

  // Inicializar Firebase Admin
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'tools-op.firebasestorage.app'
  });

  console.log('✅ Firebase Admin inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
}

// Exportar el bucket de Storage
export const bucket = admin.storage().bucket();
export default firebaseApp;