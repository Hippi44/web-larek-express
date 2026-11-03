import { RequestHandler } from 'express';
import Product, { IProduct } from '../models/product';

export const getProducts: RequestHandler = async (_req, res, next) => {
  try {
    const items = await Product.find();
    res.send({ items, total: items.length });
  } catch (error) {
    next(error);
  }
};

export const createProduct: RequestHandler = async (req, res, next) => {
  try {
    const product = await Product.create(req.body as IProduct);
    res.status(201).send(product);
  } catch (error) {
    next(error);
  }
};
