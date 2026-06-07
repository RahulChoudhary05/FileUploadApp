import path from 'path';

const ALLOWED_IMAGE_MIMETYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg']);

const ALLOWED_DOCUMENT_MIMETYPES = new Set([
  'text/plain',
  'text/csv',
  'application/json',
  'text/html',
  'application/xml',
  'application/javascript',
  'text/markdown',
]);

export const isAllowedUpload = (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();

  if (ALLOWED_IMAGE_MIMETYPES.has(mimetype) || ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return true;
  }

  if (ALLOWED_DOCUMENT_MIMETYPES.has(mimetype) || mimetype.startsWith('text/')) {
    return true;
  }

  return false;
};

export const uploadValidationMessage =
  'Allowed uploads: images (PNG, JPG, SVG) and text-based files (txt, csv, json, html, md, js, xml).';

export const isImageUpload = (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();
  return ALLOWED_IMAGE_MIMETYPES.has(mimetype) || ALLOWED_IMAGE_EXTENSIONS.has(extension);
};
