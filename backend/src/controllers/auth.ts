import { RequestHandler, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import ms from 'ms';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  AUTH_ACCESS_SECRET,
  AUTH_ACCESS_TOKEN_EXPIRY,
  AUTH_REFRESH_SECRET,
  AUTH_REFRESH_TOKEN_EXPIRY,
} from '../config';
import BadRequestError from '../errors/bad-request-error';
import NotFoundError from '../errors/not-found-error';
import UnauthorizedError from '../errors/unauthorized-error';
import User, { IUser } from '../models/user';
import AuthenticatedRequest from '../types/authenticated-request';

interface UserCredentials {
  email: string;
  password: string;
  name?: string;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  path: '/',
};

const createAccessToken = (id: string) => jwt.sign(
  { _id: id },
  AUTH_ACCESS_SECRET,
  { expiresIn: Math.floor((ms(AUTH_ACCESS_TOKEN_EXPIRY as ms.StringValue) || 600_000) / 1000) },
);

const createRefreshToken = (id: string, tokens: IUser['tokens']) => {
  const expiry = ms(AUTH_REFRESH_TOKEN_EXPIRY as ms.StringValue) || 604_800_000;
  const latestIssuedAt = tokens.reduce((latest, item) => {
    const payload = jwt.decode(item.token);
    if (typeof payload !== 'object' || !payload || typeof payload.iat !== 'number') {
      return latest;
    }
    return Math.max(latest, payload.iat);
  }, 0);
  const issuedAt = Math.max(Math.floor(Date.now() / 1000), latestIssuedAt + 1);

  return jwt.sign(
    { _id: id, iat: issuedAt },
    AUTH_REFRESH_SECRET,
    { expiresIn: Math.floor(expiry / 1000) },
  );
};

const readTokenId = (token: string, secret: string) => {
  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === 'string' || typeof (payload as JwtPayload)._id !== 'string') {
      throw new UnauthorizedError('Некорректный токен');
    }
    return (payload as JwtPayload)._id as string;
  } catch (_error) {
    throw new UnauthorizedError('Некорректный или просроченный токен');
  }
};

const sendSession = (
  res: Response,
  user: HydratedDocument<IUser>,
  replacedToken?: string,
) => {
  const userId = user._id.toString();
  const refreshToken = createRefreshToken(userId, user.tokens);
  const tokens = replacedToken
    ? user.tokens.filter((item) => item.token !== replacedToken)
    : user.tokens;
  user.set('tokens', [...tokens, { token: refreshToken }]);

  return user.save().then(() => {
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: ms(AUTH_REFRESH_TOKEN_EXPIRY as ms.StringValue) || 604_800_000,
    });
    res.send({
      user: { name: user.name, email: user.email },
      success: true,
      accessToken: createAccessToken(userId),
    });
  });
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const credentials = req.body as UserCredentials;
    const password = await bcrypt.hash(credentials.password, 10);
    const user = await User.create({
      name: credentials.name,
      email: credentials.email,
      password,
    });
    await sendSession(res, user);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const credentials = req.body as UserCredentials;
    const user = await User.findOne({ email: credentials.email }).select('+password +tokens');
    if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
      next(new UnauthorizedError('Неверная почта или пароль'));
      return;
    }
    await sendSession(res, user);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedRequest = req as AuthenticatedRequest;
    if (!authenticatedRequest.user) {
      next(new UnauthorizedError('Требуется авторизация'));
      return;
    }
    const user = await User.findById(authenticatedRequest.user._id);
    if (!user) {
      next(new NotFoundError('Пользователь не найден'));
      return;
    }
    res.send({ user: { name: user.name, email: user.email }, success: true });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (typeof refreshToken !== 'string') {
      next(new UnauthorizedError('Требуется refresh-токен'));
      return;
    }

    const userId = readTokenId(refreshToken, AUTH_REFRESH_SECRET);
    if (!mongoose.isValidObjectId(userId)) {
      next(new UnauthorizedError('Некорректный refresh-токен'));
      return;
    }

    const user = await User.findById(userId).select('+tokens');
    if (!user) {
      next(new NotFoundError('Пользователь не найден'));
      return;
    }
    if (!user.tokens.some((item) => item.token === refreshToken)) {
      next(new UnauthorizedError('Refresh-токен больше не действует'));
      return;
    }

    await sendSession(res, user, refreshToken);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (typeof refreshToken !== 'string') {
      next(new UnauthorizedError('Требуется refresh-токен'));
      return;
    }

    const userId = readTokenId(refreshToken, AUTH_REFRESH_SECRET);
    if (!mongoose.isValidObjectId(userId)) {
      next(new BadRequestError('Некорректный идентификатор пользователя'));
      return;
    }

    const user = await User.findById(userId).select('+tokens');
    if (!user) {
      next(new NotFoundError('Пользователь не найден'));
      return;
    }
    if (!user.tokens.some((item) => item.token === refreshToken)) {
      next(new UnauthorizedError('Refresh-токен больше не действует'));
      return;
    }

    user.tokens = user.tokens.filter((item) => item.token !== refreshToken);
    await user.save();
    res.cookie('refreshToken', '', { ...cookieOptions, maxAge: 0 });
    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};
