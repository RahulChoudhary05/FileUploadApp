import mongoose from 'mongoose';
import Folder from '../models/Folder.js';

const sanitizeSegment = (value = '') =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'folder';

export const getFolderHierarchy = async (userId, folderId) => {
  const segments = [];

  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    return [{ id: String(folderId), name: 'root', slug: 'root' }];
  }

  let current = await Folder.findOne({ _id: folderId, userId });

  if (!current) {
    return [{ id: String(folderId), name: 'root', slug: 'root' }];
  }

  while (current) {
    segments.unshift({
      id: current._id.toString(),
      name: current.name,
      slug: sanitizeSegment(current.name),
    });

    if (!current.parentFolderId) {
      break;
    }

    current = await Folder.findOne({ _id: current.parentFolderId, userId });
  }

  return segments;
};

export const getFolderStorageSegments = async (userId, folderId) => {
  const hierarchy = await getFolderHierarchy(userId, folderId);
  return hierarchy.map((segment) => segment.slug);
};

export { sanitizeSegment };
