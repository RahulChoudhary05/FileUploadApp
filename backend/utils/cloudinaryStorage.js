import cloudinary from '../config/cloudinary.js';
import { sanitizeSegment } from './folderPath.js';

// All images go into this single Cloudinary folder (public secure URLs stored in DB)
export const CLOUDINARY_IMAGE_FOLDER = 'folder-upload-app/images';

export const hasCloudinaryConfig = () => {
  if (process.env.CLOUDINARY_URL?.trim()) {
    return true;
  }

  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );
};

export const verifyCloudinaryConnection = async () => {
  if (!hasCloudinaryConfig()) {
    return { configured: false, ok: false, message: 'Cloudinary env variables are not set' };
  }

  try {
    const response = await cloudinary.api.ping();
    return {
      configured: true,
      ok: response?.status === 'ok',
      message: 'Cloudinary connected',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
      folder: CLOUDINARY_IMAGE_FOLDER,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message:
        error?.error?.message ||
        error?.message ||
        'Cloudinary connection failed',
    };
  }
};

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });

    stream.end(buffer);
  });

export const uploadImageToCloudinary = async ({ file, displayName }) => {
  const safeBaseName = sanitizeSegment(displayName || file.originalname || 'image');

  const result = await uploadBuffer(file.buffer, {
    folder: CLOUDINARY_IMAGE_FOLDER,
    resource_type: 'image',
    public_id: `${Date.now()}-${safeBaseName}`,
    overwrite: false,
    unique_filename: true,
    use_filename: false,
  });

  return {
    url: result.secure_url,
    cloudinaryPublicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
    bytes: result.bytes || file.size,
    storageProvider: 'cloudinary',
    cloudinaryFolder: CLOUDINARY_IMAGE_FOLDER,
  };
};

export const uploadRawToCloudinary = async ({ file, displayName }) => {
  const safeBaseName = sanitizeSegment(displayName || file.originalname || 'file');

  const result = await uploadBuffer(file.buffer, {
    folder: CLOUDINARY_IMAGE_FOLDER,
    resource_type: 'raw',
    public_id: `${Date.now()}-${safeBaseName}`,
    overwrite: false,
    unique_filename: true,
    use_filename: false,
  });

  return {
    url: result.secure_url,
    cloudinaryPublicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format || null,
    bytes: result.bytes || file.size,
    storageProvider: 'cloudinary',
    cloudinaryFolder: CLOUDINARY_IMAGE_FOLDER,
  };
};

export const deleteCloudinaryAsset = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType || 'image' });
};
