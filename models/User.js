import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true
  },
  password: {
    type: String,
    required: function() {
      // La contraseña es requerida solo si no existe un activationToken
      return !this.activationToken;
    },
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'technician'],
    default: 'technician'
  },
  activationToken: {
    type: String
  },
  activationExpires: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true // Los usuarios son activos por defecto
  }
}, { timestamps: true });

// Pre-save hook para encriptar la contraseña
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;



// <<<<<<<<<<<<------------------<<<<<<<<<<>>>>>>--------------------->>>>>>>>>>>>>>>>>>>
// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const UserSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'El nombre es obligatorio']
//   },
//   email: {
//     type: String,
//     required: [true, 'El email es obligatorio'],
//     unique: true
//   },
//   password: {
//     type: String,
//     required: [true, 'La contraseña es obligatoria'],
//     select: false
//   },
//   role: {
//     type: String,
//     enum: ['admin', 'technician'],
//     default: 'technician'
//   }
// }, { timestamps: true });

// // Encriptar la contraseña antes de guardarla
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// // Método para comparar contraseñas
// UserSchema.methods.matchPassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model('User', UserSchema);
// export default User;
