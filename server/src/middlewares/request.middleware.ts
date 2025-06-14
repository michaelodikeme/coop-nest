import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

declare global {
    var userAgent: string | undefined;
    var deviceInfo: string | undefined;
    var ipAddress: string | undefined;
}

export const requestContextMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    // Set user agent
    global.userAgent = req.headers['user-agent']?.toString() || 'unknown';
    
    // Get IP address
    global.ipAddress = 
        (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || 
        req.socket.remoteAddress || 
        'unknown';
    
    // Set device info - you can expand this based on your needs
    global.deviceInfo = (req.headers['sec-ch-ua']?.toString() || 
                       req.headers['sec-ch-ua-platform']?.toString() ||
                       req.headers['user-agent']?.toString() ||
                       'unknown');

    next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request processed', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
        logger.info(`Request completed with status ${res.statusCode} in ${duration}ms`)
    });

    next();
};