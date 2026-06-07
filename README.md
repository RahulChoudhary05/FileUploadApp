# Dobby Ads Full Stack Assignment - Folder Upload Manager

Production-ready full stack app with:

- Signup, login, logout (JWT auth in Node.js)
- User-specific folder/file access
- Nested folders (Google Drive style)
- Recursive folder size calculation (includes all nested levels)
- File upload support (images, csv, json, html, txt, and more)
- Cloudinary storage integration for uploaded files

## Tech Stack

- Frontend: Next.js (React, JSX)
- Backend: Node.js + Express
- Database: MongoDB Atlas + Mongoose
- Storage: Cloudinary

## Project Structure

```
FolderUploadApp/
  app/                    # Next.js app router pages (JSX)
  components/             # UI and feature components (JSX)
  lib/                    # auth context + API helpers
  backend/
    config/               # db + cloudinary config
    controllers/          # auth, folder, file logic
    middleware/           # auth middleware
    models/               # User, Folder, Image(file) models
    routes/               # API routes
    utils/                # recursive folder-size utilities
```

## Backend Environment

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:3000
DNS_SERVERS=8.8.8.8,1.1.1.1

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

NODE_ENV=development
```

## Frontend Environment

Create `.env.local` in root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Run Locally

### 1) Install dependencies

```bash
# frontend
npm install

# backend
cd backend
npm install
```

### 2) Start backend

```bash
cd backend
npm start
```

### 3) Start frontend

```bash
# from project root
npm run dev
```

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Folders

- `POST /api/folders` (supports `parentFolderId`)
- `GET /api/folders?parentFolderId=...`
- `GET /api/folders/:folderId`
- `PUT /api/folders/:folderId`
- `DELETE /api/folders/:folderId` (recursive)
- `GET /api/folders/:folderId/path`

### Files

- `POST /api/images/upload` (`multipart/form-data`, field: `file`, also accepts any file format)
- `GET /api/images?folderId=...`
- `GET /api/images/:imageId`
- `DELETE /api/images/:imageId`
- `PUT /api/images/:imageId/rename`

## Assignment Coverage

- Signup/Login/Logout: completed
- Nested folders: completed
- Folder size (recursive): completed
- Upload image/file with name: completed
- User-specific visibility and access: completed
- Authentication in Node.js (no Firebase): completed

## Important Notes

- Atlas SRV DNS fallback is implemented for `querySrv ECONNREFUSED` using `DNS_SERVERS`.
- If port 5000 is already used, backend exits with a clear message instead of crashing.
- Cloudinary credentials are required for upload endpoints.

## Deployment

- Backend: Render/Railway/Fly
- Frontend: Vercel
- Database: MongoDB Atlas
- Storage: Cloudinary
