import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectMongo(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  return mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 10_000,
  });
}
