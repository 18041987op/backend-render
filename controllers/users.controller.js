import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Registrar usuario
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    const user = await User.create({ name, email, password, role });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al registrar usuario', error: error.message });
  }
};

// Iniciar sesión
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Por favor ingrese email y contraseña' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: error.message });
  }
};

// Obtener perfil de usuario autenticado
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener perfil', error: error.message });
  }
};

// Obtener todos los usuarios (solo admin)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener usuarios', error: error.message });
  }
};

// **Obtener todos los técnicos**
export const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('_id name email');
    res.status(200).json({ success: true, count: technicians.length, data: technicians });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener lista de técnicos', error: error.message });
  }
};
