import { RequestHandler } from 'express';
import NotFoundError from '../errors/not-found-error';

const notFound: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('Маршрут не найден'));
};

export default notFound;
