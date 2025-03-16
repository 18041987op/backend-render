import Notification from '../models/Notification.js';

// Obtener notificaciones del usuario autenticado
export const getMyNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const notifications = await Notification.find({ recipient: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones', error: error.message });
  }
};

// Obtener cantidad de notificaciones no leídas
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener conteo de notificaciones', error: error.message });
  }
};

// Marcar notificación como leída
export const markAsRead = async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notificación no encontrada' });

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'No autorizado para acceder a esta notificación' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al marcar notificación como leída', error: error.message });
  }
};

// **Eliminar una notificación**
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notificación no encontrada' });

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'No autorizado para eliminar esta notificación' });
    }

    await notification.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar notificación', error: error.message });
  }
};
