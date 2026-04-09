//IMPORTS
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

//REQUEST LOGGER
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const ms = Math.round(performance.now() - start);
    const status = res.statusCode;
    
    // ATTEMPT TO EXTRACT USERID IF INJECTED BY AUTH MIDDLEWARE
    const userId = (req as any).userId ? `User: ${(req as any).userId}` : 'Anonymous';
    
    logger.info(`[${req.method}] ${req.originalUrl} | Status: ${status} | Time: ${ms}ms | ${userId}`);
  });
  
  next();
};
