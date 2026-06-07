import 'dotenv/config';
import { verifyCloudinaryConnection, uploadImageToCloudinary } from '../utils/cloudinaryStorage.js';

const run = async () => {
  const status = await verifyCloudinaryConnection();
  console.log('Cloudinary status:', status);

  if (!status.ok) {
    process.exit(1);
  }

  const testFile = {
    originalname: 'health-check.png',
    mimetype: 'image/png',
    size: 68,
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    ),
  };

  const uploaded = await uploadImageToCloudinary({
    file: testFile,
    displayName: 'health-check',
  });

  console.log('Test upload URL:', uploaded.url);
  console.log('Cloudinary folder:', uploaded.cloudinaryFolder);
};

run().catch((error) => {
  console.error('Cloudinary check failed:', error?.error?.message || error.message);
  process.exit(1);
});
