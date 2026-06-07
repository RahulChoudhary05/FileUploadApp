import express from 'express';
import {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  getFolderPath,
} from '../controllers/folderController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createFolder);
router.get('/', getFolders);
router.get('/:folderId', getFolderById);
router.put('/:folderId', updateFolder);
router.delete('/:folderId', deleteFolder);
router.get('/:folderId/path', getFolderPath);

export default router;
