import { RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AUTH_ACCESS_SECRET } from '../config';
import UnauthorizedError from '../errors/unauthorized-error';
import AuthenticatedRequest from '../types/authenticated-request';

const auth: RequestHandler = (req, _res, next) => {
  const authorization = req.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Требуется авторизация'));
    return;
  }

  try {
    const payload = jwt.verify(authorization.slice(7), AUTH_ACCESS_SECRET);
    if (typeof payload === 'string' || typeof (payload as JwtPayload)._id !== 'string') {
      next(new UnauthorizedError('Некорректный токен авторизации'));
      return;
    }
    (req as AuthenticatedRequest).user = { _id: (payload as JwtPayload)._id as string };
    next();
  } catch (_error) {
    next(new UnauthorizedError('Требуется авторизация'));
  }
};

export default auth;
