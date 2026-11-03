import {
  access,
  copyFile,
  mkdir,
  readdir,
  stat,
  unlink,
} from 'fs/promises';
import path from 'path';
import cron from 'node-cron';
import { UPLOAD_PATH, UPLOAD_PATH_TEMP } from '../config';
import BadRequestError from '../errors/bad-request-error';

const getImageName = (fileName: string) => {
  const match = /^\/images\/([\w.-]+)$/.exec(fileName);
  if (!match) {
    throw new BadRequestError('Некорректный путь к изображению');
  }
  return match[1];
};

const isMissingFile = (error: unknown) => (
  error instanceof Error && 'code' in error && error.code === 'ENOENT'
);

export const ensureUploadDirectories = async () => {
  await Promise.all([
    mkdir(UPLOAD_PATH, { recursive: true }),
    mkdir(UPLOAD_PATH_TEMP, { recursive: true }),
  ]);
};

export const moveUploadedImage = async (fileName: string) => {
  const name = getImageName(fileName);
  const tempPath = path.join(UPLOAD_PATH_TEMP, name);
  const publicPath = path.join(UPLOAD_PATH, name);

  try {
    await access(tempPath);
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }
    try {
      await access(publicPath);
      return false;
    } catch (publicError) {
      if (isMissingFile(publicError)) {
        throw new BadRequestError('Загруженное изображение не найдено');
      }
      throw publicError;
    }
  }

  await copyFile(tempPath, publicPath);
  await unlink(tempPath);
  return true;
};

export const removeUploadedImage = async (fileName: string) => {
  const imagePath = path.join(UPLOAD_PATH, getImageName(fileName));
  try {
    await unlink(imagePath);
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }
  }
};

export const scheduleTempCleanup = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const names = await readdir(UPLOAD_PATH_TEMP);
      const expirationTime = Date.now() - 24 * 60 * 60 * 1000;
      await Promise.all(names.map(async (name) => {
        const filePath = path.join(UPLOAD_PATH_TEMP, name);
        const fileInfo = await stat(filePath);
        if (fileInfo.mtimeMs < expirationTime) {
          await unlink(filePath);
        }
      }));
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : 'Не удалось очистить временные файлы'}\n`);
    }
  });
};
