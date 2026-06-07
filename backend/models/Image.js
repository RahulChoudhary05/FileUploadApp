import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    storageProvider: {
      type: String,
      default: 'cloudinary',
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    localPath: {
      type: String,
      default: null,
    },
    resourceType: {
      type: String,
      default: 'image',
    },
    format: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Image', imageSchema);
