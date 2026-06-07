import Image from '../models/Image.js';
import Folder from '../models/Folder.js';
import { refreshFolderSizeCascade } from '../utils/folderSize.js';
import { isAllowedUpload, isImageUpload, uploadValidationMessage } from '../utils/uploadValidation.js';
import {
  deleteCloudinaryAsset,
  hasCloudinaryConfig,
  uploadImageToCloudinary,
  uploadRawToCloudinary,
} from '../utils/cloudinaryStorage.js';
import { saveFileLocally, uploadsRootDir } from '../utils/localStorage.js';
import fs from 'fs/promises';
import path from 'path';

export const uploadImage = async (req, res) => {
  try {
    const { folderId, name } = req.body;
    const userId = req.userId;
    const file = req.file || req.files?.[0];

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!isAllowedUpload(file)) {
      return res.status(400).json({ message: uploadValidationMessage });
    }

    if (!folderId) {
      return res.status(400).json({ message: 'Folder ID is required' });
    }

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const imageUpload = isImageUpload(file);

    if (imageUpload && !name?.trim()) {
      return res.status(400).json({ message: 'Image name is required' });
    }

    const displayName = name?.trim() || file.originalname;
    let stored = null;

    if (imageUpload) {
      if (!hasCloudinaryConfig()) {
        return res.status(503).json({
          message:
            'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env',
        });
      }

      try {
        stored = await uploadImageToCloudinary({ file, displayName });
      } catch (uploadError) {
        const cloudinaryMessage =
          uploadError?.error?.message ||
          uploadError?.message ||
          'Cloudinary image upload failed';

        console.warn(`Cloudinary image upload failed, using local storage: ${cloudinaryMessage}`);
        stored = await saveFileLocally({ file, userId, folderId, displayName });
        stored.storageWarning = `Saved locally because Cloudinary failed: ${cloudinaryMessage}`;
      }
    } else if (hasCloudinaryConfig()) {
      try {
        stored = await uploadRawToCloudinary({ file, displayName });
      } catch (uploadError) {
        console.warn(`Cloudinary raw upload failed, using local storage: ${uploadError.message}`);
        stored = await saveFileLocally({ file, userId, folderId, displayName });
      }
    } else {
      stored = await saveFileLocally({ file, userId, folderId, displayName });
    }

    const image = new Image({
      name: displayName,
      folderId,
      userId,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: stored.bytes || file.size,
      url: stored.url,
      storageProvider: stored.storageProvider,
      cloudinaryPublicId: stored.cloudinaryPublicId || null,
      localPath: stored.localPath || null,
      resourceType: stored.resourceType,
      format: stored.format,
    });

    await image.save();
    await refreshFolderSizeCascade(userId, folderId);

    const responseBody = image.toObject();
    if (stored.storageWarning) {
      responseBody.storageWarning = stored.storageWarning;
    }

    res.status(201).json(responseBody);
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
      await deleteCloudinaryAsset(image.cloudinaryPublicId, image.resourceType || 'image');
    }

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

export const serveImageContent = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.userId;

    const image = await Image.findOne({ _id: imageId, userId });
    if (!image) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (image.storageProvider === 'local' && image.localPath) {
      const absolutePath = path.resolve(image.localPath);
      if (!absolutePath.startsWith(uploadsRootDir)) {
        return res.status(403).json({ message: 'Invalid file path' });
      }

      res.setHeader('Content-Type', image.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${image.name}"`);
      return res.sendFile(absolutePath);
    }

    if (image.url?.startsWith('http')) {
      return res.redirect(image.url);
    }

    return res.status(404).json({ message: 'File content unavailable' });
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
