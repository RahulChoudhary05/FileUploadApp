import express from 'express';
import multer from 'multer';
import {
  uploadImage,
  getImages,
  deleteImage,
  getImageById,
  renameImage,
  serveImageContent,
} from '../controllers/imageController.js';
import { verifyToken } from '../middleware/auth.js';
import { isAllowedUpload, uploadValidationMessage } from '../utils/uploadValidation.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (isAllowedUpload(file)) {
      cb(null, true);
      return;
    }
    cb(new Error(uploadValidationMessage));
  },
});

router.use(verifyToken);

router.post('/upload', upload.any(), uploadImage);
router.get('/', getImages);
router.get('/:imageId/content', serveImageContent);
router.get('/:imageId', getImageById);
router.delete('/:imageId', deleteImage);
router.put('/:imageId/rename', renameImage);

export default router;
