import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';
import createOrder from '../controllers/order';

const orderRouter = Router();

const orderBody = Joi.object({
  payment: Joi.string().valid('card', 'online').required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
  total: Joi.number().min(0).required(),
  items: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
});

orderRouter.post('/', celebrate({ [Segments.BODY]: orderBody }), createOrder);

export default orderRouter;
