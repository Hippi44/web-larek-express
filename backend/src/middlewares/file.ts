import { randomUUID } from 'crypto';
import { mkdir } from 'fs/promises';
import multer from 'multer';
import { UPLOAD_MAX_SIZE, UPLOAD_PATH_TEMP } from '../config';
import BadRequestError from '../errors/bad-request-error';

const extensions: Record<string, string> = {
  'image/png': '.png',
  'image/jpg': '.jpg',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    mkdir(UPLOAD_PATH_TEMP, { recursive: true })
      .then(() => callback(null, UPLOAD_PATH_TEMP))
      .catch((error: Error) => callback(error, UPLOAD_PATH_TEMP));
  },
  filename: (_req, file, callback) => {
    const extension = Object.prototype.hasOwnProperty.call(extensions, file.mimetype)
      ? extensions[file.mimetype]
      : '.bin';
    callback(null, `${randomUUID()}${extension}`);
  },
});

const fileMiddleware = multer({
  storage,
  limits: { fileSize: UPLOAD_MAX_SIZE },
  fileFilter: (_req, file, callback) => {
    if (!Object.prototype.hasOwnProperty.call(extensions, file.mimetype)) {
      callback(new BadRequestError('Недопустимый тип файла'));
      return;
    }
    callback(null, true);
  },
});

export default fileMiddleware;
