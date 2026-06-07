import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import { verifyCloudinaryConnection } from './utils/cloudinaryStorage.js';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(','),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean).map((origin) => origin.trim());

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (absolute path so cwd does not break file access)
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/images', imageRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  const cloudinary = await verifyCloudinaryConnection();
  res.status(200).json({
    message: 'Server is running',
    storage: {
      cloudinary,
      localUploads: uploadsDir,
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 100 MB)' : err.message,
    });
  }

  if (err.message?.includes('Allowed uploads')) {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = Number(process.env.PORT || 5000);

const listenWithFallbackPort = (port, maxAttempts = 5) => new Promise((resolve, reject) => {
  const server = app.listen(port, () => {
    resolve({ server, port });
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && maxAttempts > 0) {
      console.warn(`Port ${port} is in use. Retrying on port ${port + 1}...`);
      resolve(listenWithFallbackPort(port + 1, maxAttempts - 1));
      return;
    }

    reject(error);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    const cloudinaryStatus = await verifyCloudinaryConnection();
    if (cloudinaryStatus.configured) {
      if (cloudinaryStatus.ok) {
        console.log('Cloudinary: connected');
      } else {
        console.warn(`Cloudinary: ${cloudinaryStatus.message}`);
        console.warn(
          'Image uploads will fail until CLOUDINARY_CLOUD_NAME matches your dashboard cloud name (e.g. dxxxxxx).'
        );
      }
    } else {
      console.warn('Cloudinary: not configured (image uploads require Cloudinary credentials)');
    }

    const { server, port } = await listenWithFallbackPort(PORT);
    console.log(`Server running on port ${port}`);

    server.on('error', (error) => {
      console.error('Server listen error:', error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
