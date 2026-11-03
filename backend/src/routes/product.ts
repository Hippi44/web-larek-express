import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';
import { createProduct, getProducts } from '../controllers/product';

const productRouter = Router();

const productBody = Joi.object({
  title: Joi.string().min(2).max(30).required(),
  image: Joi.object({
    fileName: Joi.string().required(),
    originalName: Joi.string().required(),
  }).required(),
  category: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number().allow(null),
});

productRouter.get('/', getProducts);
productRouter.post('/', celebrate({ [Segments.BODY]: productBody }), createProduct);

export default productRouter;
