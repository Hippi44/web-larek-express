import HttpError from './http-error';

class BadRequestError extends HttpError {
  constructor(message: string) {
    super(message, 400);
  }
}

export default BadRequestError;
