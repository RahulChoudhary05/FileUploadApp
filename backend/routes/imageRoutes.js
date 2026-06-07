import express from 'express';
import multer from 'multer';
import {
  uploadImage,
  getImages,
  deleteImage,
  getImageById,
  renameImage,
} from '../controllers/imageController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

router.use(verifyToken);

router.post('/upload', upload.any(), uploadImage);
router.get('/', getImages);
router.get('/:imageId', getImageById);
router.delete('/:imageId', deleteImage);
router.put('/:imageId/rename', renameImage);

export default router;
