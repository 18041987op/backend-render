import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import supabase, { shopId } from '../config/supabase.js';

// Generate JWT token (for login)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register user (public registration)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const { data: existing } = await supabase
      .from('tools_users')
      .select('id')
      .eq('shop_id', shopId)
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data: user, error } = await supabase
      .from('tools_users')
      .insert({
        shop_id: shopId,
        name,
        email,
        password_hash,
        role: role || 'technician',
        is_active: true,
      })
      .select('id, name, email, role')
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      user: { _id: user.id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user.id),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al registrar usuario', error: error.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Por favor ingrese email y contraseña' });
    }

    const { data: user, error } = await supabase
      .from('tools_users')
      .select('id, name, email, role, password_hash, is_active')
      .eq('shop_id', shopId)
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Tu cuenta está desactivada. Contacta al administrador.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ success: false, message: 'Cuenta pendiente de activación. Revisa tu email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    return res.status(200).json({
      success: true,
      user: { _id: user.id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user.id),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: error.message });
  }
};

// Get authenticated user profile
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    return res.status(200).json({
      success: true,
      user: { _id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener perfil', error: error.message });
  }
};

// Get all users (admin only)
export const getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('tools_users')
      .select('id, name, email, role, is_active, created_at')
      .eq('shop_id', shopId)
      .order('name');

    if (error) throw error;

    // Map id -> _id for frontend compatibility
    const mapped = users.map(u => ({ ...u, _id: u.id }));
    return res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener usuarios', error: error.message });
  }
};

// Get all technicians
export const getTechnicians = async (req, res) => {
  try {
    const { data: technicians, error } = await supabase
      .from('tools_users')
      .select('id, name, email')
      .eq('shop_id', shopId)
      .eq('role', 'technician')
      .eq('is_active', true);

    if (error) throw error;

    const mapped = technicians.map(t => ({ ...t, _id: t.id }));
    return res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener lista de técnicos', error: error.message });
  }
};

// Get a specific user by ID (admin)
export const getUserByIdAsAdmin = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('tools_users')
      .select('id, name, email, role, is_active, created_at, updated_at')
      .eq('id', req.params.id)
      .eq('shop_id', shopId)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.status(200).json({ success: true, data: { ...user, _id: user.id } });
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuario', error: error.message });
  }
};

// Update a user by ID (admin)
export const updateUserByAdmin = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const userIdToUpdate = req.params.id;

    // Get current user
    const { data: user, error: fetchErr } = await supabase
      .from('tools_users')
      .select('id, email, role')
      .eq('id', userIdToUpdate)
      .eq('shop_id', shopId)
      .single();

    if (fetchErr || !user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Check if email is already in use by another user
    if (email && email !== user.email) {
      const { data: existing } = await supabase
        .from('tools_users')
        .select('id')
        .eq('shop_id', shopId)
        .eq('email', email)
        .neq('id', userIdToUpdate)
        .single();

      if (existing) {
        return res.status(400).json({ success: false, message: 'El email ya está registrado por otro usuario.' });
      }
    }

    // Build update object
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (typeof isActive === 'boolean') {
      if (req.user.id === userIdToUpdate && !isActive) {
        return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta desde aquí.' });
      }
      updates.is_active = isActive;
    }

    const { data: updated, error } = await supabase
      .from('tools_users')
      .update(updates)
      .eq('id', userIdToUpdate)
      .eq('shop_id', shopId)
      .select('id, name, email, role, is_active')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Usuario actualizado correctamente.', data: { ...updated, _id: updated.id } });
  } catch (error) {
    console.error('Error al actualizar usuario por admin:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar usuario', error: error.message });
  }
};

// Admin creates user with email activation
export const adminCreateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const allowedRoles = ['technician', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }

    const { data: existing } = await supabase
      .from('tools_users')
      .select('id')
      .eq('shop_id', shopId)
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    const activationToken = crypto.randomBytes(20).toString('hex');
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: user, error } = await supabase
      .from('tools_users')
      .insert({
        shop_id: shopId,
        name,
        email,
        role,
        activation_token: activationToken,
        activation_expires: activationExpires,
        is_active: true,
      })
      .select('id, name, email')
      .single();

    if (error) throw error;

    // Send activation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const activationUrl = `${process.env.CLIENT_URL}/activate/${user.id}/${activationToken}`;

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Sistema de Herramientas'}" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Activa tu cuenta - Sistema de Control de Herramientas',
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
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(`Error al enviar email de activación a: ${user.email}`, err);
        return res.status(500).json({ success: false, message: 'Error al enviar el email de activación', error: err.message });
      }
      console.log(`Email de activación enviado a: ${user.email} | ID: ${info.messageId}`);
      return res.status(201).json({
        success: true,
        message: 'Usuario creado y email de activación enviado',
        data: { userId: user.id },
      });
    });
  } catch (error) {
    console.error('Error en adminCreateUser:', error);
    return res.status(500).json({ success: false, message: 'Error al crear usuario', error: error.message });
  }
};

// Activate user account
export const activateUser = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'La contraseña es obligatoria.' });
    }

    const { data: user, error } = await supabase
      .from('tools_users')
      .select('id, activation_token, activation_expires')
      .eq('id', userId)
      .eq('activation_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({ success: false, message: 'Token de activación inválido o usuario no encontrado.' });
    }

    if (new Date(user.activation_expires) < Date.now()) {
      return res.status(400).json({ success: false, message: 'El token de activación ha expirado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { error: updateErr } = await supabase
      .from('tools_users')
      .update({ password_hash, activation_token: null, activation_expires: null })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    return res.status(200).json({ success: true, message: 'Cuenta activada exitosamente.' });
  } catch (error) {
    console.error('Error en activateUser:', error);
    return res.status(500).json({ success: false, message: 'Error al activar la cuenta', error: error.message });
  }
};

// Update user active/inactive status
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const userIdToUpdate = req.params.id;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'El estado "isActive" debe ser true o false.' });
    }

    if (req.user.id === userIdToUpdate && !isActive) {
      return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta de administrador.' });
    }

    if (!isActive) {
      const { count } = await supabase
        .from('tools_users')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('role', 'admin')
        .eq('is_active', true);

      if (count <= 1) {
        const { data: userToCheck } = await supabase
          .from('tools_users')
          .select('role')
          .eq('id', userIdToUpdate)
          .single();

        if (userToCheck && userToCheck.role === 'admin') {
          return res.status(400).json({ success: false, message: 'No se puede desactivar al último administrador activo.' });
        }
      }
    }

    const { data: user, error } = await supabase
      .from('tools_users')
      .update({ is_active: isActive })
      .eq('id', userIdToUpdate)
      .eq('shop_id', shopId)
      .select('id, name, email, role, is_active')
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente.`,
      data: { ...user, _id: user.id },
    });
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar estado del usuario', error: error.message });
  }
};
