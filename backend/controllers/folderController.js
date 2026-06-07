import Folder from '../models/Folder.js';
import Image from '../models/Image.js';
import {
  calculateFolderSize,
  getFolderAndDescendantIds,
  refreshFolderSizeCascade,
} from '../utils/folderSize.js';
import { ensureDefaultFolders } from '../utils/ensureDefaultFolders.js';

export const setupDefaultFolders = async (req, res) => {
  try {
    const userId = req.userId;
    const { hello, subHello } = await ensureDefaultFolders(userId);
    res.status(200).json({
      hello,
      subHello,
      message: 'Default folders ready',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createFolder = async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    if (parentFolderId) {
      const parentFolder = await Folder.findOne({ _id: parentFolderId, userId });
      if (!parentFolder) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }
    }

    const folder = new Folder({
      name,
      userId,
      parentFolderId: parentFolderId || null,
    });

    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFolders = async (req, res) => {
  try {
    const userId = req.userId;
    const { parentFolderId } = req.query;

    const query = { userId };
    if (parentFolderId) {
      query.parentFolderId = parentFolderId;
    } else {
      query.parentFolderId = null;
    }

    const folders = await Folder.find(query).sort({ createdAt: -1, name: 1 });

    await Promise.all(
      folders.map(async (folder) => {
        const totalSize = await calculateFolderSize(userId, folder._id.toString());
        if (folder.size !== totalSize) {
          folder.size = totalSize;
          await Folder.updateOne({ _id: folder._id, userId }, { size: totalSize });
        }
      })
    );

    res.status(200).json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFolderById = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId;

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.status(200).json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const folder = await Folder.findOneAndUpdate(
      { _id: folderId, userId },
      { name },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.status(200).json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId;

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const parentFolderId = folder.parentFolderId;
    const folderIdsToDelete = await getFolderAndDescendantIds(userId, folderId);

    await Image.deleteMany({ userId, folderId: { $in: folderIdsToDelete } });
    await Folder.deleteMany({ userId, _id: { $in: folderIdsToDelete } });

    if (parentFolderId) {
      await refreshFolderSizeCascade(userId, parentFolderId);
    }

    res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFolderPath = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId;

    const path = [];
    let currentFolder = await Folder.findOne({ _id: folderId, userId });

    while (currentFolder) {
      path.unshift({ id: currentFolder._id, name: currentFolder.name });
      if (currentFolder.parentFolderId) {
        currentFolder = await Folder.findOne({
          _id: currentFolder.parentFolderId,
          userId,
        });
      } else {
        break;
      }
    }

    res.status(200).json(path);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
