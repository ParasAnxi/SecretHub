import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

// Extend Express Request object to hold user ID
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

//AUTHORIZATION MIDDLEWARE
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check cookie first, fallback to Authorization header
    const accessToken = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!accessToken) {
       res.status(401).json({ success: false, message: 'Authentication required' });
       return;
    }

    const decoded = verifyAccessToken(accessToken);
    req.userId = decoded.userId;
    next();
  } catch (error) {
     res.status(401).json({ success: false, message: 'Invalid or expired access token' });
     return;
  }
};
