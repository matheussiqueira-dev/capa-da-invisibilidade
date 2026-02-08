import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  API_KEY: z.string().min(8).default('change-me'),
  BODY_LIMIT: z.coerce.number().int().min(1024).max(20 * 1024 * 1024).default(5_242_880),
  STORAGE_DIR: z.string().min(1).default('./storage'),
  DATABASE_PATH: z.string().min(1).default('./data/app.json'),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(60_000)
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${message}`);
}

const env = parsedEnv.data;

export const config = {
  env: env.NODE_ENV,
  host: env.HOST,
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,
  apiKey: env.API_KEY,
  bodyLimit: env.BODY_LIMIT,
  storageDir: env.STORAGE_DIR,
  databasePath: env.DATABASE_PATH,
  rateLimitMax: env.RATE_LIMIT_MAX,
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS
};
