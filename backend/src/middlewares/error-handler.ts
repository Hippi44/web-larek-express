import { ErrorRequestHandler } from 'express';
import { isCelebrateError } from 'celebrate';
import mongoose from 'mongoose';
import multer from 'multer';
import BadRequestError from '../errors/bad-request-error';
import ConflictError from '../errors/conflict-error';
import HttpError from '../errors/http-error';
import ServerError from '../errors/server-error';

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (isCelebrateError(error)) {
    res.status(400).send({ message: error.message });
    return;
  }

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Размер файла превышает допустимый'
      : 'Не удалось загрузить файл';
    res.status(400).send({ message });
    return;
  }

  if (
    error instanceof mongoose.Error.ValidationError
    || error instanceof mongoose.Error.CastError
  ) {
    const validationError = new BadRequestError(error.message);
    res.status(validationError.statusCode).send({ message: validationError.message });
    return;
  }

  if (error instanceof Error && 'code' in error && error.code === 11000) {
    const conflictError = new ConflictError('Такое значение уже используется');
    res.status(conflictError.statusCode).send({ message: conflictError.message });
    return;
  }

  const responseError = error instanceof HttpError
    ? error
    : new ServerError('Внутренняя ошибка сервера');

  res.status(responseError.statusCode).send({ message: responseError.message });
};

export default errorHandler;
