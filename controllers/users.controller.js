import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Generar token JWT (para login)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Registrar usuario (registro público, si se usa)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    const user = await User.create({ name, email, password, role });

    if (user) {
      return res.status(201).json({
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
    return res.status(500).json({ success: false, message: 'Error al registrar usuario', error: error.message });
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

    return res.status(200).json({
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
    return res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: error.message });
  }
};

// Obtener perfil de usuario autenticado
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener perfil', error: error.message });
  }
};

// Obtener todos los usuarios (solo admin)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener usuarios', error: error.message });
  }
};

// Obtener todos los técnicos
export const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('_id name email');
    return res.status(200).json({ success: true, count: technicians.length, data: technicians });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener lista de técnicos', error: error.message });
  }
};

// NUEVO: Obtener un usuario específico por ID (para Admin)
export const getUserByIdAsAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Excluir password

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error);
    res.status(500).json({ success: false, message: 'Error al obtener usuario', error: error.message });
  }
};

// NUEVO: Actualizar un usuario por ID (por Admin)
export const updateUserByAdmin = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const userIdToUpdate = req.params.id;

    let user = await User.findById(userIdToUpdate);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Validar si el email ya está en uso por OTRO usuario
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email });
      if (existingUser && existingUser._id.toString() !== userIdToUpdate) {
          return res.status(400).json({ success: false, message: 'El email ya está registrado por otro usuario.' });
      }
    }

    // Actualizar campos (NO actualizamos contraseña aquí)
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    // Solo actualizamos isActive si se proporciona explícitamente
    if (typeof isActive === 'boolean') {
         // Añadir protecciones para no desactivar al propio admin o al último admin (como en updateUserStatus)
         if (req.user._id.toString() === userIdToUpdate && !isActive) {
             return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta desde aquí.' });
         }
         // Podrías añadir aquí la lógica para verificar si es el último admin antes de desactivar
         user.isActive = isActive;
    }


    const updatedUser = await user.save();

    res.status(200).json({ success: true, message: 'Usuario actualizado correctamente.', data: updatedUser });

  } catch (error) {
    console.error("Error al actualizar usuario por admin:", error);
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error al actualizar usuario', error: error.message });
  }
};

// Nuevo endpoint: Crear usuario por admin con activación por email
export const adminCreateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Validar que el rol sea permitido (solo 'technician' y 'admin')
    const allowedRoles = ['technician', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }
    
    // Verificar si ya existe un usuario con ese email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }
    
    // Generar token de activación y definir fecha de expiración (24 horas)
    const activationToken = crypto.randomBytes(20).toString('hex');
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Crear el usuario sin contraseña (se establecerá luego mediante activación)
    const user = await User.create({ name, email, role, activationToken, activationExpires });
    
    // Configurar Nodemailer con Gmail
    // Configurar Nodemailer con Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Asegúrate que esta sea la CONTRASEÑA DE APLICACIÓN sin espacios
      }
    });

    // Construir URL de activación para el email
    const activationUrl = `${process.env.CLIENT_URL}/activate/${user._id}/${activationToken}`;

    // Opciones del email de activación
    // Opciones del email de activación (MODIFICADO A HTML)
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Sistema de Herramientas'}" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`, // Puedes usar las variables FROM_ si las definiste, o el EMAIL_USER
      to: user.email,
      subject: 'Activa tu cuenta - Sistema de Control de Herramientas',
      // Remover la propiedad 'text' y añadir 'html'
      // text: `Hola ${user.name},\n\n...`, <--- Eliminar o comentar esta línea
      html: `
        <p>Hola ${user.name},</p>
        <p>Se ha creado una cuenta para ti en el Sistema de Control de Herramientas.</p>
        <p>Por favor, activa tu cuenta y establece tu contraseña haciendo clic en el siguiente botón (el enlace es válido por 24 horas):</p>
        <p style="margin: 20px 0;">
          <a href="${activationUrl}" target="_blank" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-family: sans-serif;">
            Activar Cuenta y Crear Contraseña
          </a>
        </p>
        <p>Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
        <p><a href="${activationUrl}" target="_blank">${activationUrl}</a></p>
        <p>Si no solicitaste esta cuenta, por favor ignora este correo.</p>
        <br>
        <p>Saludos,<br>Equipo de Administración</p>
      `
    };


    // Enviar el email de activación
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        // Líneas de depuración clave:
        console.error(`Error al intentar enviar email de activación a: ${user.email}`); // <-- NUEVO DETALLE
        console.error('Error detallado de Nodemailer:', error); // <-- Muestra el error completo de nodemailer
        // Considera también mostrar el objeto error completo si es necesario:
        // console.error("Objeto Error completo:", JSON.stringify(error, null, 2));

        // Respuesta de error al frontend
        return res.status(500).json({ success: false, message: 'Error al enviar el email de activación', error: error.message });
      } else {
        console.log(`Email de activación enviado exitosamente a: ${user.email} | ID de mensaje: ${info.messageId}`); // Log de éxito
        return res.status(201).json({
          success: true,
          message: 'Usuario creado y email de activación enviado',
          data: { userId: user._id }
        });
      }
    });

  } catch (error) {
    // Este catch maneja errores ANTES de intentar enviar el email (ej. error al crear usuario)
    console.error('Error en adminCreateUser (antes de enviar email):', error);
    return res.status(500).json({ success: false, message: 'Error al crear usuario', error: error.message });
  }
};

// Activar cuenta de usuario
export const activateUser = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'La contraseña es obligatoria.' });
    }

    // Buscar usuario por id y token de activación
    const user = await User.findOne({ _id: userId, activationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Token de activación inválido o usuario no encontrado.' });
    }

    // Verificar si el token ha expirado
    if (user.activationExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'El token de activación ha expirado.' });
    }

    // Actualizar la contraseña y limpiar los campos de activación
    user.password = password; // El hook pre-save en el modelo se encargará de encriptarla
    user.activationToken = undefined;
    user.activationExpires = undefined;

    await user.save();

    return res.status(200).json({ success: true, message: 'Cuenta activada exitosamente.' });
  } catch (error) {
    console.error('Error en activateUser:', error);
    return res.status(500).json({ success: false, message: 'Error al activar la cuenta', error: error.message });
  }
};

// NUEVA FUNCIÓN: Actualizar estado activo/inactivo de un usuario
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body; // Esperamos recibir true o false
    const userIdToUpdate = req.params.id;

    // Validación básica
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'El estado "isActive" debe ser true o false.' });
    }

    // Protección: No permitir desactivar al propio usuario admin
    if (req.user._id.toString() === userIdToUpdate && !isActive) {
       return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta de administrador.' });
    }

    // Opcional: Protección para no desactivar al último admin (más complejo, requiere contar admins activos)
    if (!isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
         const userToDeactivate = await User.findById(userIdToUpdate);
         if (userToDeactivate && userToDeactivate.role === 'admin') {
            return res.status(400).json({ success: false, message: 'No se puede desactivar al último administrador activo.' });
         }
      }
    }

    const user = await User.findByIdAndUpdate(userIdToUpdate, { isActive }, { new: true, runValidators: true });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.status(200).json({ success: true, message: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente.`, data: user });

  } catch (error) {
    console.error("Error al actualizar estado del usuario:", error);
    res.status(500).json({ success: false, message: 'Error al actualizar estado del usuario', error: error.message });
  }
};


// <<<<<<<<<<<<------------------<<<<<<<<<<>>>>>>--------------------->>>>>>>>>>>>>>>>>>>

// import User from '../models/User.js';
// import jwt from 'jsonwebtoken';

// // Generar token JWT
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// // Registrar usuario
// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;
//     const userExists = await User.findOne({ email });

//     if (userExists) {
//       return res.status(400).json({ success: false, message: 'El usuario ya existe' });
//     }

//     const user = await User.create({ name, email, password, role });

//     if (user) {
//       res.status(201).json({
//         success: true,
//         user: {
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role
//         },
//         token: generateToken(user._id)
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al registrar usuario', error: error.message });
//   }
// };

// // Iniciar sesión
// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: 'Por favor ingrese email y contraseña' });
//     }

//     const user = await User.findOne({ email }).select('+password');
//     if (!user) {
//       return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
//     }

//     const isMatch = await user.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
//     }

//     res.status(200).json({
//       success: true,
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       },
//       token: generateToken(user._id)
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: error.message });
//   }
// };

// // Obtener perfil de usuario autenticado
// export const getUserProfile = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(403).json({ success: false, message: 'No autorizado' });
//     }

//     res.status(200).json({
//       success: true,
//       user: {
//         _id: req.user._id,
//         name: req.user.name,
//         email: req.user.email,
//         role: req.user.role
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al obtener perfil', error: error.message });
//   }
// };

// // Obtener todos los usuarios (solo admin)
// export const getUsers = async (req, res) => {
//   try {
//     const users = await User.find({});
//     res.status(200).json({ success: true, count: users.length, data: users });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al obtener usuarios', error: error.message });
//   }
// };

// // **Obtener todos los técnicos**
// export const getTechnicians = async (req, res) => {
//   try {
//     const technicians = await User.find({ role: 'technician' }).select('_id name email');
//     res.status(200).json({ success: true, count: technicians.length, data: technicians });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al obtener lista de técnicos', error: error.message });
//   }
// };
