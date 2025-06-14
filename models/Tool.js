// // backend/models/Tool.js
// import mongoose from 'mongoose';

// const ToolSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Tool name is required'] // English validation message
//   },
//   category: {
//     type: String,
//     required: [true, 'Category is required'] // English validation message
//   },
//   serialNumber: {
//     type: String,
//     unique: true, // Keep unique constraint
//     sparse: true // Allows multiple null/missing values without violating uniqueness
//   },
//   status: {
//     type: String,
//     enum: ['available', 'borrowed', 'maintenance', 'damaged'],
//     default: 'available'
//   },
//   location: {
//     type: String,
//     required: [true, 'Location is required'] // English validation message
//   },
//   description: {
//     type: String,
//     default: ''
//   },
//   // --- NEW COST FIELD --- // <-- ESTÁ CORRECTO
//   cost: {
//     type: Number,
//     required: false, // Make it optional for now
//     min: [0, 'Cost cannot be negative'], // English validation message
//     default: 0 // Default to 0 if not provided
//   },
//   // --- END NEW COST FIELD ---
//   lastMaintenance: {
//     type: Date
//   },
//   addedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User' // Reference to the User model
//   }
// }, { timestamps: true }); // timestamps adds createdAt and updatedAt

// const Tool = mongoose.model('Tool', ToolSchema);
// export default Tool;

 // backend/models/Tool.js
import mongoose from 'mongoose';

const ToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tool name is required'] // English validation message
  },
  category: {
    type: String,
    required: [true, 'Category is required'] // English validation message
  },
  serialNumber: {
    type: String,
    unique: true, // Keep unique constraint
    sparse: true // Allows multiple null/missing values without violating uniqueness
  },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'maintenance', 'damaged'],
    default: 'available'
  },
  location: {
  type: String,
  required: [true, 'Location is required'],
  enum: [
    // Diagnostic locations
    'Gabinete A1', 'Gabinete A2', 'Banco Diagnóstico',
    // Engine/Transmission locations  
    'Gabinete C1', 'Zona Motor', 'Banco Motor',
    // Hand tools locations
    'Carro Taller 1', 'Carro Taller 2', 'Banco 1', 'Banco 2',
    // Suspension/Brakes locations
    'Zona Suspensión', 'Gabinete B2', 'Zona Frenos',
    // A/C locations
    'Carro A/C', 'Zona A/C',
    // Fluids locations
    'Zona Fluidos',
    // Electrical/Pneumatic locations
    'Zona Neumática', 'Zona Eléctrica', 'Zona Carga',
    // Tires/Wheels locations
    'Zona Neumáticos', 'Área Ruedas',
    // Support/Lifting locations
    'Bahía 1', 'Bahía 2',
    // Other locations
    'Almacén General', 'Zona Misceláneos',
    // Keep your existing locations for compatibility
    'shelve 1:A', 'main shelve'
  ],
  default: 'main shelve'
},
  description: {
    type: String,
    default: ''
  },
  // --- NEW COST FIELD ---
  cost: {
    type: Number,
    required: false, // Make it optional for now
    min: [0, 'Cost cannot be negative'], // English validation message
    default: 0 // Default to 0 if not provided
  },
  // --- END NEW COST FIELD ---
  lastMaintenance: {
    type: Date
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to the User model
  },
  comments: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  }

}, { timestamps: true }); // timestamps adds createdAt and updatedAt

const Tool = mongoose.model('Tool', ToolSchema);
export default Tool;