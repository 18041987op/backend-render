// backend/seedTools.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/database.js'; // Reutilizamos tu conexión
import Tool from './models/Tool.js'; // Importamos el modelo

dotenv.config(); // Cargar variables de entorno

// --- Lista de Herramientas de Prueba ---
// Ajusta nombres, seriales o ubicaciones si lo deseas
const toolsData = [
  // Diagnóstico
  { name: 'Scanner OBD2 Autel MaxiCOM MK808', category: 'diagnostico', serialNumber: 'AUTMK808-001', location: 'Gabinete A1' },
  { name: 'Multímetro Digital Fluke 87V', category: 'diagnostico', serialNumber: 'FLU87V-002', location: 'Gabinete A1' },
  { name: 'Osciloscopio PicoScope 2204A', category: 'diagnostico', serialNumber: 'PIC2204A-003', location: 'Gabinete A2' },
  { name: 'Probador Baterías Midtronics MDX-650', category: 'diagnostico', serialNumber: 'MIDMDX650-004', location: 'Zona Carga' },

  // Herramientas Manuales
  { name: 'Juego Llaves Combinadas Métricas (24pzs)', category: 'manuales', serialNumber: 'MAN-COMB-001', location: 'Carro Taller 1' },
  { name: 'Juego Dados 1/2" y 3/8" (80pzs)', category: 'manuales', serialNumber: 'MAN-DADOS-002', location: 'Carro Taller 2' },
  { name: 'Set Destornilladores Precisión', category: 'manuales', serialNumber: 'MAN-DESTP-003', location: 'Banco 1' },
  { name: 'Alicate de Presión Vise-Grip 10WR', category: 'manuales', serialNumber: 'MAN-PRES-004', location: 'Carro Taller 1' },
  { name: 'Extractor de Poleas Universal', category: 'manuales', serialNumber: 'MAN-EXTR-005', location: 'Gabinete B1' },

  // Herramientas Eléctricas/Neumáticas
  { name: 'Llave Impacto Neumática 1/2" IR 2235TiMAX', category: 'electricas_neumaticas', serialNumber: 'NEU-IMPCT-001', location: 'Zona Neumática' },
  { name: 'Taladro Inalámbrico Dewalt 20V MAX', category: 'electricas_neumaticas', serialNumber: 'ELE-TALAD-002', location: 'Zona Carga' },
  { name: 'Amoladora Angular 4.5" Makita', category: 'electricas_neumaticas', serialNumber: 'ELE-AMOL-003', location: 'Zona Metal' },

  // Herramientas de Medición
  { name: 'Torquímetro Clic 1/2" (20-150 ft-lb)', category: 'medicion', serialNumber: 'MED-TORQ-001', location: 'Gabinete A2' },
  { name: 'Calibrador Vernier Digital 6"', category: 'medicion', serialNumber: 'MED-VERN-002', location: 'Banco 1' },
  { name: 'Juego Galgas (Feeler Gauges)', category: 'medicion', serialNumber: 'MED-GALGA-003', location: 'Carro Taller 2' },

  // Motor y Transmisión
  { name: 'Kit Sincronización Ford Zetec', category: 'motor_transmision', serialNumber: 'MOT-SYNC-001', location: 'Gabinete C1' },
  { name: 'Compresor Resortes Válvula Universal', category: 'motor_transmision', serialNumber: 'MOT-COMPV-002', location: 'Gabinete C1' },

  // Suspensión, Dirección y Frenos
  { name: 'Compresor Resortes Suspensión (Strut)', category: 'suspension_frenos', serialNumber: 'SUS-COMPR-001', location: 'Zona Suspensión' },
  { name: 'Separador Rótulas (Ball Joint)', category: 'suspension_frenos', serialNumber: 'SUS-ROTUL-002', location: 'Gabinete B2' },
  { name: 'Kit Purgador Frenos Neumático', category: 'suspension_frenos', serialNumber: 'FRE-PURGA-003', location: 'Zona Frenos' },

  // Aire Acondicionado (A/C)
  { name: 'Juego Manómetros A/C R134a', category: 'aire_acondicionado', serialNumber: 'AC-MANOM-001', location: 'Carro A/C' },
  { name: 'Detector Fugas Electrónico UV', category: 'aire_acondicionado', serialNumber: 'AC-FUGAS-002', location: 'Carro A/C' },

  // Neumáticos y Ruedas
  { name: 'Manómetro Digital Presión Neumáticos', category: 'neumaticos_ruedas', serialNumber: 'NEU-MANOM-001', location: 'Zona Neumáticos' },

  // Manejo de Fluidos
  { name: 'Bomba Manual Extracción Fluidos', category: 'manejo_fluidos', serialNumber: 'FLU-EXTR-001', location: 'Zona Fluidos' },
  { name: 'Llave Filtro Aceite (Correa)', category: 'manejo_fluidos', serialNumber: 'FLU-FILT-002', location: 'Carro Taller 1' },

  // Equipos de Elevación y Soporte
  { name: 'Gato Hidráulico Piso 3 Ton', category: 'elevacion_soporte', serialNumber: 'ELEV-GATO-001', location: 'Bahía 1' },
  { name: 'Par Torres Soporte (Borriquetas) 3 Ton', category: 'elevacion_soporte', serialNumber: 'ELEV-TORR-002', location: 'Bahía 2' },

  // Otros / Misceláneos
  { name: 'Lámpara Inspección LED Recargable', category: 'otros', serialNumber: 'OTR-LAMP-001', location: 'Banco 2' },
];


// --- Función para insertar los datos ---
const seedDB = async () => {
  try {
    await connectDB(); // Conectar a la BD
    console.log('Conectado a MongoDB para seeding...');

    // Opcional: Eliminar herramientas existentes antes de insertar (más seguro hacerlo manual como en Paso 1)
    // console.log('Eliminando herramientas existentes...');
    // await Tool.deleteMany({});

    console.log(`Insertando ${toolsData.length} herramientas de prueba...`);
    await Tool.insertMany(toolsData);

    console.log('¡Herramientas de prueba insertadas exitosamente!');
  } catch (error) {
    console.error('Error durante el seeding:', error);
  } finally {
    console.log('Cerrando conexión MongoDB...');
    await mongoose.connection.close();
    process.exit(); // Salir del script
  }
};

// --- Ejecutar la función ---
seedDB();