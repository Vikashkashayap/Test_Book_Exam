import mongoose from 'mongoose';
import { env } from './env';

const connectOptions = {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 10000,
};

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  const uris = [env.MONGODB_URI, env.MONGODB_URI_FALLBACK].filter(
    (uri, index, arr) => uri && arr.indexOf(uri) === index
  ) as string[];

  let lastError: Error | null = null;

  for (const uri of uris) {
    try {
      await mongoose.connect(uri, connectOptions);
      console.log(`MongoDB connected: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      return;
    } catch (err) {
      lastError = err as Error;
      console.warn(`MongoDB connection failed for URI, trying next... (${(err as Error).message})`);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => undefined);
      }
    }
  }

  console.error('\n❌ Could not connect to MongoDB.');
  console.error('   • Atlas SRV error (ECONNREFUSED)? Use local MongoDB in .env:');
  console.error('     MONGODB_URI=mongodb://127.0.0.1:27017/exam_prep');
  console.error('   • Or copy "Standard connection string" from MongoDB Atlas (not SRV)\n');
  throw lastError ?? new Error('MongoDB connection failed');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
