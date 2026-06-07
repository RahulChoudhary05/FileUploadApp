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
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/rtf',
  'text/xml',
  'application/xml',
]);

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  '.txt',
  '.csv',
  '.json',
  '.html',
  '.htm',
  '.xml',
  '.js',
  '.md',
  '.markdown',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.rtf',
]);

export const isAllowedUpload = (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();

  if (ALLOWED_IMAGE_MIMETYPES.has(mimetype) || ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return true;
  }

  if (ALLOWED_DOCUMENT_MIMETYPES.has(mimetype) || ALLOWED_DOCUMENT_EXTENSIONS.has(extension) || mimetype.startsWith('text/')) {
    return true;
  }

  return false;
};

export const uploadValidationMessage =
  'Allowed uploads: images (PNG, JPG, SVG) and documents (TXT, CSV, JSON, HTML, MD, JS, XML, PDF, DOC, DOCX, XLS, XLSX, RTF).';

export const isImageUpload = (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();
  return ALLOWED_IMAGE_MIMETYPES.has(mimetype) || ALLOWED_IMAGE_EXTENSIONS.has(extension);
};
