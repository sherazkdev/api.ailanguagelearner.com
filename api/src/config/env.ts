import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3019),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URI: z.string().min(1),
  X_API_KEY: z.string().min(8),
  /** Empty → message API returns { text: null } */
  GROQ_API_KEY: z.string().optional().default(''),
  /** Fast Groq model available on current accounts (override e.g. qwen/qwen3.8-27b). */
  GROQ_MODEL: z.string().default('llama-3.1-8b-instant'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  RATE_LIMIT_TIME_WINDOW_MS: z.coerce.number().default(60_000),
});

export const env = envSchema.parse(process.env);
