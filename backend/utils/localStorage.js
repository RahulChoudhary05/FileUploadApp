import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFolderStorageSegments, sanitizeSegment } from './folderPath.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadsRootDir = path.join(__dirname, '..', 'uploads');

const sanitizeFilename = (filename) =>
  filename
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

export const saveFileLocally = async ({ file, userId, folderId, displayName }) => {
  const folderSegments = await getFolderStorageSegments(userId, folderId);
  const storageDir = path.join(uploadsRootDir, String(userId), ...folderSegments);
  await fs.mkdir(storageDir, { recursive: true });

  const safeName = sanitizeFilename(file.originalname || displayName || 'upload.bin');
  const uniqueName = `${Date.now()}-${safeName}`;
  const localPath = path.join(storageDir, uniqueName);

  await fs.writeFile(localPath, file.buffer);

  const urlPath = ['uploads', String(userId), ...folderSegments, uniqueName].join('/');

  return {
    url: `/${urlPath}`,
    localPath,
    resourceType: file.mimetype?.startsWith('image/') ? 'image' : 'raw',
    format: path.extname(safeName).replace(/^\./, '') || null,
    bytes: file.size,
    storageProvider: 'local',
  };
};

export { sanitizeFilename };
