import expressWinston from 'express-winston';
import winston from 'winston';

const requestWhitelist = ['method', 'url', 'httpVersion'];
const responseWhitelist = ['statusCode'];

export const requestLogger = expressWinston.logger({
  transports: [new winston.transports.File({ filename: 'request.log' })],
  format: winston.format.json(),
  requestWhitelist,
  responseWhitelist,
});

export const errorLogger = expressWinston.errorLogger({
  transports: [new winston.transports.File({ filename: 'error.log' })],
  format: winston.format.json(),
  requestWhitelist,
});
