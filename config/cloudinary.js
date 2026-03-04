// backend/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube un buffer de imagen a Cloudinary.
 * Compatible con Multer memoryStorage().
 * @param {Buffer} buffer  - Contenido del archivo
 * @param {object} options - Opciones de Cloudinary (folder, public_id, etc.)
 * @returns {Promise<object>} Resultado de Cloudinary (incluye secure_url)
 */
export const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });

export default cloudinary;
