import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envPath = (name: string, fallback: string) => {
  const value = process.env[name] || fallback;
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
};

export const PORT = Number(process.env.PORT) || 3000;
export const DB_ADDRESS = process.env.DB_ADDRESS || 'mongodb://127.0.0.1:27017/weblarek';
export const ORIGIN_ALLOW = process.env.ORIGIN_ALLOW || 'http://localhost:5173';
export const PUBLIC_PATH = envPath('PUBLIC_PATH', 'src/public');
export const UPLOAD_PATH = envPath('UPLOAD_PATH', 'src/public/images');
export const UPLOAD_PATH_TEMP = envPath('UPLOAD_PATH_TEMP', 'src/public/temp');
export const UPLOAD_MAX_SIZE = Number(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024;
export const AUTH_ACCESS_SECRET = process.env.AUTH_ACCESS_SECRET || '';
export const AUTH_REFRESH_SECRET = process.env.AUTH_REFRESH_SECRET || '';
export const AUTH_ACCESS_TOKEN_EXPIRY = process.env.AUTH_ACCESS_TOKEN_EXPIRY || '10m';
export const AUTH_REFRESH_TOKEN_EXPIRY = process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d';
