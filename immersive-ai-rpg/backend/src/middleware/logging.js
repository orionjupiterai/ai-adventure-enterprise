import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.http(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    user: req.user?.id,
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.http(`${req.method} ${req.url} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      ip: req.ip,
      user: req.user?.id,
    });
  });
  
  next();
};