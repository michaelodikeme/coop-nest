import winston from 'winston';
import { Request } from 'express';
import util from 'util';
import path from 'path';

const { combine, timestamp, printf, colorize } = winston.format;

// Custom formatter to sanitize error stacks by removing absolute paths
const sanitizeErrorStack = (info: any) => {
  // Only process if there's an error with a stack
  if (info instanceof Error && info.stack) {
    // Get the project root directory
    const projectRoot = path.resolve(__dirname, '../..');
    
    // Replace full paths with relative paths
    info.stack = info.stack
      .split('\n')
      .map((line: string) => {
        return line.replace(new RegExp(projectRoot.replace(/\\/g, '\\\\'), 'g'), '.');
      })
      .join('\n');
  } else if (info.message && typeof info.message === 'string' && info.message.includes(path.sep)) {
    // If the message itself contains paths
    const projectRoot = path.resolve(__dirname, '../..');
    info.message = info.message.replace(new RegExp(projectRoot.replace(/\\/g, '\\\\'), 'g'), '.');
  }
  
  return info;
};

const lineFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}\n`;
  
  if (metadata && Object.keys(metadata).length > 0) {
    msg += 'Metadata:\n';
    msg += util.inspect(metadata, { 
      colors: true,
      depth: null,
      breakLength: Infinity,
      compact: false
    }) + '\n';
  }
  
  return msg;
});

// Create a custom format that sanitizes error stacks
const sanitizeFormat = winston.format(sanitizeErrorStack);

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    sanitizeFormat(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    lineFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      level: 'info',
      format: combine(
        sanitizeFormat(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        lineFormat
      )
    }),
    new winston.transports.File({
      filename: 'logs/errors.log', 
      level: 'error',
      format: combine(
        sanitizeFormat(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        lineFormat
      )
    })
  ]
});

export const requestLogger = (req: Request) => {
  logger.info(`Incoming ${req.method} request to ${req.url}`);
  logger.info('Request Headers:', req.headers);
  if (Object.keys(req.body).length > 0) {
    logger.info('Request Body:', req.body);
  }
};

export const errorLogger = (error: Error, context?: Record<string, unknown>) => {
  // Sanitize the error stack before logging
  const sanitizedError = {...error};
  if (sanitizedError.stack) {
    const projectRoot = path.resolve(__dirname, '../..');
    sanitizedError.stack = sanitizedError.stack
      .split('\n')
      .map((line: string) => line.replace(new RegExp(projectRoot.replace(/\\/g, '\\\\'), 'g'), '.'))
      .join('\n');
  }
  
  logger.error(`Error: ${error.message}`);
  if (sanitizedError.stack) {
    logger.error('Stack Trace:', { stack: sanitizedError.stack });
  }
  if (context) {
    logger.error('Error Context:', context);
  }
};

export default logger;
