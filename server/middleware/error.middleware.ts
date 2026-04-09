//IMPORTS
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

//ERROR HANDLER
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // SANITIZE BODY TO AVOID LOGGING SENSITIVE USER INFO LIKE PASSWORDS
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.password) {
    sanitizedBody.password = '***HIDDEN***';
  }

  const context = {
    method: req.method,
    path: req.originalUrl,
    body: Object.keys(sanitizedBody).length ? sanitizedBody : undefined,
    params: Object.keys(req.params).length ? req.params : undefined,
    query: Object.keys(req.query).length ? req.query : undefined,
    userId: (req as any).userId || 'Anonymous',
  };

  logger.error('Unhandled Server Exception:', err, context);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
