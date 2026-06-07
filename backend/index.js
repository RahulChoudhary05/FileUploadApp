import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import fs from 'fs';

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(','),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean).map((origin) => origin.trim());

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
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

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/images', imageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
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
