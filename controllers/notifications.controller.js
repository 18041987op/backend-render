import supabase, { shopId } from '../config/supabase.js';

// Get notifications for authenticated user
export const getMyNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { data: notifications, error } = await supabase
      .from('tool_notifications')
      .select('*')
      .eq('recipient_id', req.user.id)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = notifications.map(n => ({ ...n, _id: n.id }));
    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones', error: error.message });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('tool_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', req.user.id)
      .eq('shop_id', shopId)
      .eq('read', false);

    if (error) throw error;

    res.status(200).json({ success: true, count: count || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener conteo de notificaciones', error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { data: notification, error: fetchErr } = await supabase
      .from('tool_notifications')
      .select('id, recipient_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !notification) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }

    if (notification.recipient_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No autorizado para acceder a esta notificación' });
    }

    const { data: updated, error } = await supabase
      .from('tool_notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data: { ...updated, _id: updated.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al marcar notificación como leída', error: error.message });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { data: notification, error: fetchErr } = await supabase
      .from('tool_notifications')
      .select('id, recipient_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !notification) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }

    if (notification.recipient_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No autorizado para eliminar esta notificación' });
    }

    const { error } = await supabase
      .from('tool_notifications')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar notificación', error: error.message });
  }
};
