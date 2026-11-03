import HttpError from './http-error';

class ServerError extends HttpError {
  constructor(message: string) {
    super(message, 500);
  }
}

export default ServerError;
