import Folder from '../models/Folder.js';
import Image from '../models/Image.js';
import mongoose from 'mongoose';

export const getFolderAndDescendantIds = async (userId, folderId) => {
  const ids = [];
  const queue = [folderId.toString()];

  while (queue.length) {
    const currentId = queue.shift();
    ids.push(currentId);

    const children = await Folder.find({ userId, parentFolderId: currentId }).select('_id');
    for (const child of children) {
      queue.push(child._id.toString());
    }
  }

  return ids;
};

export const calculateFolderSize = async (userId, folderId) => {
  const folderIds = await getFolderAndDescendantIds(userId, folderId);
  const objectIds = folderIds.map((id) => new mongoose.Types.ObjectId(id));
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const totals = await Image.aggregate([
    {
      $match: {
        userId: userObjectId,
        folderId: { $in: objectIds },
      },
    },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$size' },
      },
    },
  ]);

  return totals[0]?.totalSize || 0;
};

export const refreshFolderSizeCascade = async (userId, folderId) => {
  let currentFolder = await Folder.findOne({ _id: folderId, userId }).select('_id parentFolderId');

  while (currentFolder) {
    const totalSize = await calculateFolderSize(userId, currentFolder._id.toString());
    await Folder.updateOne({ _id: currentFolder._id, userId }, { size: totalSize });

    if (!currentFolder.parentFolderId) {
      break;
    }

    currentFolder = await Folder.findOne({ _id: currentFolder.parentFolderId, userId }).select(
      '_id parentFolderId'
    );
  }
};
