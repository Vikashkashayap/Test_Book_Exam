import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadFile(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' | 'video' = 'raw'
): Promise<{ url: string; publicId: string }> {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary not configured');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `exam-prep/${folder}`, resource_type: resourceType },
      (error, result) => {
        if (error || !result) reject(error ?? new Error('Upload failed'));
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFile(publicId: string): Promise<void> {
  if (env.CLOUDINARY_CLOUD_NAME) {
    await cloudinary.uploader.destroy(publicId);
  }
}
