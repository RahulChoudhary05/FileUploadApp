# Image Manager Backend

A Node.js/Express API for managing images with nested folder structure, built with MongoDB.

## Features

- User authentication (JWT-based)
- Nested folder structure
- Image upload and management
- File storage
- MongoDB integration

## Setup

### Prerequisites

- Node.js 16+
- MongoDB Atlas account (free tier available)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.example` to `.env` and fill in the values:
```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/image-manager
JWT_SECRET=your-secret-key-here
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Running Locally

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Deployment to Render

1. Create a Render account at https://render.com
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables**: Add the following:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A random secret key
     - `FRONTEND_URL`: Your frontend URL on Vercel
     - `NODE_ENV`: production

5. Deploy!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Folders
- `POST /api/folders` - Create a folder
- `GET /api/folders` - Get folders (with optional parent folder filter)
- `GET /api/folders/:id` - Get folder by ID
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder
- `GET /api/folders/:id/path` - Get folder path (breadcrumbs)

### Images
- `POST /api/images/upload` - Upload an image
- `GET /api/images` - Get images in a folder
- `GET /api/images/:id` - Get image by ID
- `DELETE /api/images/:id` - Delete image
- `PUT /api/images/:id/rename` - Rename image

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `PORT` | Server port (default: 5000) |
| `FRONTEND_URL` | Frontend application URL for CORS |
| `NODE_ENV` | Environment (development/production) |

## MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Get the connection string and add to `.env`

## Notes

- File uploads are stored in the `uploads/` directory
- Maximum file size: 50MB
- Only image files are accepted
