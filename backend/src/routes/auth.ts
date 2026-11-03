import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';
import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
} from '../controllers/auth';
import auth from '../middlewares/auth';

const authRouter = Router();

const loginBody = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const registerBody = Joi.object({
  name: Joi.string().min(2).max(30),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

authRouter.post('/login', celebrate({ [Segments.BODY]: loginBody }), login);
authRouter.post('/register', celebrate({ [Segments.BODY]: registerBody }), register);
authRouter.get('/token', refreshAccessToken);
authRouter.get('/logout', logout);
authRouter.get('/user', auth, getCurrentUser);

export default authRouter;
