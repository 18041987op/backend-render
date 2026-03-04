// backend/controllers/upload.controller.js
import { uploadBuffer } from '../config/cloudinary.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const uploadToolImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen' });
    }

    const { toolId } = req.body;
    if (!toolId) {
      return res.status(400).json({ success: false, message: 'toolId es requerido' });
    }

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Solo se permiten imágenes (JPG, PNG, WEBP, GIF)' });
    }

    if (req.file.size > MAX_SIZE_BYTES) {
      return res.status(400).json({ success: false, message: 'La imagen no debe superar 5 MB' });
    }

    const result = await uploadBuffer(req.file.buffer, {
      folder: `tools/${toolId}`,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      message: 'Imagen subida exitosamente',
    });

  } catch (error) {
    console.error('Error subiendo imagen a Cloudinary:', error);
    res.status(500).json({ success: false, message: 'Error al subir la imagen', error: error.message });
  }
};
