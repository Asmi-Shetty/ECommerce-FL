import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nashik_organic_super_secret_jwt_key_2026_unbreakable';

export const protect = (req: any, res: Response, next: NextFunction): void => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access forbidden: insufficient privilege level' });
      return;
    }
    next();
  };
};
