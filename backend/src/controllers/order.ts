import { RequestHandler } from 'express';
import { randomUUID } from 'crypto';
import BadRequestError from '../errors/bad-request-error';
import Product from '../models/product';

interface OrderBody {
  payment: 'card' | 'online';
  email: string;
  phone: string;
  address: string;
  total: number;
  items: string[];
}

const createOrder: RequestHandler = async (req, res, next) => {
  try {
    const order = req.body as OrderBody;
    const products = await Product.find({ _id: { $in: order.items } });
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));

    if (productsById.size !== new Set(order.items).size) {
      throw new BadRequestError('Один или несколько товаров не найдены');
    }

    const orderedProducts = order.items.map((id) => productsById.get(id));
    if (orderedProducts.some((product) => !product || product.price === null)) {
      throw new BadRequestError('В заказе есть товар без цены');
    }

    const total = orderedProducts.reduce((sum, product) => sum + (product?.price || 0), 0);
    if (total !== order.total) {
      throw new BadRequestError('Сумма заказа не совпадает со стоимостью товаров');
    }

    res.status(201).send({ id: randomUUID(), total });
  } catch (error) {
    next(error);
  }
};

export default createOrder;
