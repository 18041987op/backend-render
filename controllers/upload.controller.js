// backend/controllers/upload.controller.js
import { bucket } from '../config/firebase.js';

export const uploadToolImage = async (req, res) => {
  try {
    // Verificar que venga un archivo
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se recibió ninguna imagen' 
      });
    }

    // Verificar que venga el toolId
    const { toolId } = req.body;
    if (!toolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'toolId es requerido' 
      });
    }

    // Verificar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Solo se permiten imágenes (JPG, PNG, WEBP, GIF)' 
      });
    }

    // Verificar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        success: false, 
        message: 'La imagen no debe superar 5MB' 
      });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^\w.\-]+/g, '_');
    const fileName = `tools/${toolId}/${timestamp}-${safeName}`;

    // Crear referencia al archivo en Storage
    const file = bucket.file(fileName);

    // Subir archivo
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    // Hacer el archivo público
    await file.makePublic();

    // Obtener URL pública
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    console.log('✅ Imagen subida exitosamente:', publicUrl);

    res.status(200).json({
      success: true,
      url: publicUrl,
      message: 'Imagen subida exitosamente'
    });

  } catch (error) {
    console.error('❌ Error subiendo imagen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al subir la imagen', 
      error: error.message 
    });
  }
};