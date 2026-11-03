import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from '../controllers/product';
import auth from '../middlewares/auth';

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

const productUpdateBody = Joi.object({
  title: Joi.string().min(2).max(30),
  image: Joi.object({
    fileName: Joi.string().required(),
    originalName: Joi.string().required(),
  }),
  category: Joi.string(),
  description: Joi.string(),
  price: Joi.number().allow(null),
}).min(1);

const productParams = Joi.object({
  productId: Joi.string().hex().length(24).required(),
});

productRouter.get('/', getProducts);
productRouter.get('/:productId', celebrate({ [Segments.PARAMS]: productParams }), getProduct);
productRouter.post('/', auth, celebrate({ [Segments.BODY]: productBody }), createProduct);
productRouter.patch(
  '/:productId',
  auth,
  celebrate({ [Segments.PARAMS]: productParams, [Segments.BODY]: productUpdateBody }),
  updateProduct,
);
productRouter.delete(
  '/:productId',
  auth,
  celebrate({ [Segments.PARAMS]: productParams }),
  deleteProduct,
);

export default productRouter;
