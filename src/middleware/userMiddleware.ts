import { Request, Response, NextFunction } from 'express';

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID is required in headers' });
  }
  
  res.locals.userId = userId;
  next();
};

export default userMiddleware;
