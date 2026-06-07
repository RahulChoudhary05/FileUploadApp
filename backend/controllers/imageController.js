import Image from '../models/Image.js';
import Folder from '../models/Folder.js';
import cloudinary from '../config/cloudinary.js';
import { refreshFolderSizeCascade } from '../utils/folderSize.js';
import fs from 'fs/promises';
import path from 'path';

const uploadToCloudinary = (fileBuffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });

    stream.end(fileBuffer);
  });

const sanitizeFilename = (filename) =>
  filename
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const saveLocally = async (file, userId) => {
  const uploadsRoot = path.resolve('uploads', String(userId));
  await fs.mkdir(uploadsRoot, { recursive: true });

  const safeName = sanitizeFilename(file.originalname || 'upload.bin');
  const uniqueName = `${Date.now()}-${safeName}`;
  const localPath = path.join(uploadsRoot, uniqueName);

  await fs.writeFile(localPath, file.buffer);

  return {
    url: `/uploads/${userId}/${uniqueName}`,
    localPath,
    resourceType: file.mimetype?.startsWith('image/') ? 'image' : 'raw',
    format: path.extname(safeName).replace(/^\./, '') || null,
  };
};

export const uploadImage = async (req, res) => {
  try {
    const { folderId, name } = req.body;
    const userId = req.userId;
    const file = req.file || req.files?.[0];

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!folderId) {
      return res.status(400).json({ message: 'Folder ID is required' });
    }

    // Verify folder belongs to user
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const hasCloudinaryConfig =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    let uploaded = null;
    let storageProvider = 'local';
    let cloudinaryPublicId = null;
    let resourceType = file.mimetype?.startsWith('image/') ? 'image' : 'raw';
    let format = path.extname(file.originalname || '').replace(/^\./, '') || null;
    let url = null;
    let localPath = null;

    if (hasCloudinaryConfig) {
      try {
        uploaded = await uploadToCloudinary(file.buffer, {
          folder: `folder-upload-app/${userId}`,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          filename_override: file.originalname,
        });

        storageProvider = 'cloudinary';
        cloudinaryPublicId = uploaded.public_id;
        resourceType = uploaded.resource_type;
        format = uploaded.format || format;
        url = uploaded.secure_url;
      } catch (uploadError) {
        console.warn(`Cloudinary upload failed, falling back to local storage: ${uploadError.message}`);
      }
    }

    if (!url) {
      const localUpload = await saveLocally(file, userId);
      storageProvider = 'local';
      localPath = localUpload.localPath;
      resourceType = localUpload.resourceType;
      format = localUpload.format;
      url = localUpload.url;
    }

    const image = new Image({
      name: name || file.originalname,
      folderId,
      userId,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
      storageProvider,
      cloudinaryPublicId,
      localPath,
      resourceType,
      format,
    });

    await image.save();
    await refreshFolderSizeCascade(userId, folderId);

    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getImages = async (req, res) => {
  try {
    const { folderId } = req.query;
    const userId = req.userId;

    if (!folderId) {
      return res.status(400).json({ message: 'Folder ID is required' });
    }

    const images = await Image.find({ folderId, userId }).sort({ createdAt: -1 });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.userId;

    const image = await Image.findOne({ _id: imageId, userId });
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (image.storageProvider === 'local' && image.localPath) {
      await fs.unlink(image.localPath).catch(() => null);
    } else if (image.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(image.cloudinaryPublicId, {
        resource_type: image.resourceType || 'image',
      });
    }

    // Delete image record
    await Image.deleteOne({ _id: imageId });
    await refreshFolderSizeCascade(userId, image.folderId);

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getImageById = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.userId;

    const image = await Image.findOne({ _id: imageId, userId });
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.status(200).json(image);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const renameImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ message: 'Image name is required' });
    }

    const image = await Image.findOneAndUpdate(
      { _id: imageId, userId },
      { name },
      { new: true }
    );

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.status(200).json(image);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
