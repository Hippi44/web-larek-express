import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
  };
}

export default AuthenticatedRequest;
