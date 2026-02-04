import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '0.0.0.0',
  port: toNumber(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  apiKey: process.env.API_KEY ?? 'change-me',
  bodyLimit: toNumber(process.env.BODY_LIMIT, 5_242_880),
  storageDir: process.env.STORAGE_DIR ?? './storage',
  databasePath: process.env.DATABASE_PATH ?? './data/app.json',
  rateLimitMax: toNumber(process.env.RATE_LIMIT_MAX, 60),
  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000)
};
