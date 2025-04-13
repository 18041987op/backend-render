import mongoose from 'mongoose';

const ToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la herramienta es obligatorio']
  },
  category: {
    type: String,
    required: [true, 'La categoría es obligatoria']
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true // Permite valores nulos/ausentes sin violar la unicidad
  },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'maintenance', 'damaged'],
    default: 'available'
  },
  // --- CAMPOS AÑADIDOS ---
  location: {
    type: String,
    required: [true, 'La ubicación es obligatoria'] // Marcado como obligatorio
  },
  description: {
    type: String,
    default: '' // Por defecto es una cadena vacía si no se proporciona
  },
  cost: {
    type: Number,
    required: false, // Optional field
    min: 0,          // Cannot be negative
    default: 0       // Default to 0 if not provided
  },

  // --- FIN CAMPOS AÑADIDOS ---
  lastMaintenance: {
    type: Date
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true }); // timestamps añade createdAt y updatedAt

const Tool = mongoose.model('Tool', ToolSchema);
export default Tool;