import jwt from 'jsonwebtoken';
import supabase, { shopId } from '../config/supabase.js';

// Middleware to protect routes with JWT
export const protect = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No está autorizado para acceder a esta ruta',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('tools_users')
      .select('id, name, email, role, is_active')
      .eq('id', decoded.id)
      .eq('shop_id', shopId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado con este token',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Tu cuenta está desactivada. Contacta al administrador.',
      });
    }

    // Normalize user object so controllers can use user.id consistently
    // Also add _id alias for any code that still references it
    req.user = { ...user, _id: user.id };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'No está autorizado para acceder a esta ruta',
      error: err.message,
    });
  }
};

// Middleware to verify roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `El rol ${req.user.role} no está autorizado para acceder a esta ruta`,
      });
    }
    next();
  };
};
