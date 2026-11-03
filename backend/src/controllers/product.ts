import { RequestHandler } from 'express';
import NotFoundError from '../errors/not-found-error';
import { moveUploadedImage, removeUploadedImage } from '../services/files';
import Product, { IProduct } from '../models/product';

export const getProducts: RequestHandler = async (_req, res, next) => {
  try {
    const items = await Product.find();
    res.send({ items, total: items.length });
  } catch (error) {
    next(error);
  }
};

export const getProduct: RequestHandler = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      next(new NotFoundError('Товар не найден'));
      return;
    }
    res.send(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct: RequestHandler = async (req, res, next) => {
  let movedImage = false;
  let saved = false;
  try {
    const data = req.body as IProduct;
    movedImage = await moveUploadedImage(data.image.fileName);
    const product = await Product.create(data);
    saved = true;
    res.status(201).send(product);
  } catch (error) {
    if (movedImage && !saved) {
      const data = req.body as IProduct;
      try {
        await removeUploadedImage(data.image.fileName);
      } catch (cleanupError) {
        next(cleanupError);
        return;
      }
    }
    next(error);
  }
};

export const updateProduct: RequestHandler = async (req, res, next) => {
  let movedImage = false;
  let saved = false;
  const data = req.body as Partial<IProduct>;
  try {
    const currentProduct = await Product.findById(req.params.productId);
    if (!currentProduct) {
      next(new NotFoundError('Товар не найден'));
      return;
    }

    if (data.image) {
      movedImage = await moveUploadedImage(data.image.fileName);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      data,
      { new: true, runValidators: true },
    );
    if (!product) {
      if (movedImage && data.image) {
        await removeUploadedImage(data.image.fileName);
      }
      next(new NotFoundError('Товар не найден'));
      return;
    }
    saved = true;

    if (data.image && currentProduct.image.fileName !== data.image.fileName) {
      await removeUploadedImage(currentProduct.image.fileName);
    }
    res.send(product);
  } catch (error) {
    if (movedImage && data.image && !saved) {
      try {
        await removeUploadedImage(data.image.fileName);
      } catch (cleanupError) {
        next(cleanupError);
        return;
      }
    }
    next(error);
  }
};

export const deleteProduct: RequestHandler = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) {
      next(new NotFoundError('Товар не найден'));
      return;
    }
    res.send(product);
  } catch (error) {
    next(error);
  }
};
