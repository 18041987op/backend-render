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
    sparse: true
  },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'maintenance', 'damaged'],
    default: 'available'
  },
  lastMaintenance: {
    type: Date
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const Tool = mongoose.model('Tool', ToolSchema);
export default Tool;
