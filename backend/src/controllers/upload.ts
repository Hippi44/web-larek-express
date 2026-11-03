import { RequestHandler } from 'express';
import path from 'path';
import BadRequestError from '../errors/bad-request-error';

const uploadFile: RequestHandler = (req, res, next) => {
  if (!req.file) {
    next(new BadRequestError('Файл не передан'));
    return;
  }

  res.status(201).send({
    fileName: `/images/${req.file.filename}`,
    originalName: path.basename(req.file.originalname),
  });
};

export default uploadFile;
