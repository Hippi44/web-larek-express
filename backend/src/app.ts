import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import {
  AUTH_ACCESS_SECRET,
  AUTH_REFRESH_SECRET,
  DB_ADDRESS,
  ORIGIN_ALLOW,
  PORT,
  PUBLIC_PATH,
} from './config';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import errorHandler from './middlewares/error-handler';
import { errorLogger, requestLogger } from './middlewares/logger';
import notFound from './middlewares/not-found';
import orderRouter from './routes/order';
import productRouter from './routes/product';
import { ensureUploadDirectories, scheduleTempCleanup } from './services/files';

const app = express();

app.use(requestLogger);
app.use(cors({ origin: ORIGIN_ALLOW, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.resolve(PUBLIC_PATH)));

app.use('/product', productRouter);
app.use('/order', orderRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);

app.use(notFound);
app.use(errorLogger);
app.use(errorHandler);

const start = async () => {
  if (!AUTH_ACCESS_SECRET || !AUTH_REFRESH_SECRET) {
    throw new Error('Не заданы секреты JWT в .env');
  }
  await ensureUploadDirectories();
  await mongoose.connect(DB_ADDRESS);
  scheduleTempCleanup();
  app.listen(PORT, () => {
    process.stdout.write(`Сервер запущен на порту ${PORT}\n`);
  });
};

start().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Не удалось запустить сервер'}\n`);
  process.exit(1);
});

export default app;
