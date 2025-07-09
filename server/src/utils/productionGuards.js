import { logger } from './logger.js';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const devOnly = (fn) => {
  return (...args) => {
    if (isDevelopment) {
      return fn(...args);
    }
    return undefined;
  };
};

export const prodOnly = (fn) => {
  return (...args) => {
    if (isProduction) {
      return fn(...args);
    }
    return undefined;
  };
};

export const envSwitch = (devFn, prodFn) => {
  return isDevelopment ? devFn() : prodFn();
};

export const assertDevelopment = (message) => {
  if (isProduction) {
    throw new Error(message || 'This operation is only allowed in development environment');
  }
};

export const assertProduction = (message) => {
  if (isDevelopment) {
    throw new Error(message || 'This operation is only allowed in production environment');
  }
};

export const safePrint = (label, data) => {
  if (isDevelopment) {
    logger.debug(label, data);
    return;
  }
  
  const sanitized = sanitizeData(data);
  logger.production(label, sanitized);
};

const sanitizeData = (obj, depth = 2) => {
  if (depth <= 0) return '[Object]';
  
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeData(item, depth - 1));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'jwt', 'cookie', 'session'];
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeData(value, depth - 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return obj;
};

export const measurePerformance = (name, fn) => {
  if (isDevelopment) {
    return (...args) => {
      const start = process.hrtime.bigint();
      const result = fn(...args);
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000;
      logger.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      return result;
    };
  }
  return fn;
};

export const withDebugMiddleware = (middleware) => {
  return (req, res, next) => {
    if (isDevelopment) {
      return middleware(req, res, next);
    }
    return next();
  };
};

export const getCorsConfig = () => {
  return envSwitch(
    () => ({
      origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:80'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }),
    () => ({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://domka.me'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );
};

export const validateInput = (input, rules) => {
  if (isDevelopment && !rules) {
    logger.warn('Validation rules not provided in development mode');
    return { valid: true, errors: [] };
  }
  
  if (isProduction && !rules) {
    throw new Error('Validation rules are required in production');
  }
  
  const errors = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = input[field];
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      if (rule.type && typeof value !== rule.type) {
        errors.push(`${field} must be of type ${rule.type}`);
      }
      
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} must be no more than ${rule.maxLength} characters`);
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const getServerFeatureFlags = () => {
  return {
    enableDetailedLogging: isDevelopment,
    enableDebugRoutes: isDevelopment,
    enableStackTraces: isDevelopment,
    enablePerformanceMetrics: isDevelopment,
    strictValidation: isProduction
  };
};

export const safeErrorResponse = (error, defaultMessage = 'An error occurred') => {
  if (isDevelopment) {
    return {
      success: false,
      message: error.message,
      stack: error.stack,
      details: error
    };
  }
  
  const safeMessages = [
    'User not found',
    'Invalid credentials',
    'Access denied',
    'Resource not found',
    'Validation failed',
    'Rate limit exceeded'
  ];
  
  const isSafeMessage = safeMessages.some(safe => 
    error.message && error.message.toLowerCase().includes(safe.toLowerCase())
  );
  
  return {
    success: false,
    message: isSafeMessage ? error.message : defaultMessage
  };
};

export default {
  isDevelopment,
  isProduction,
  devOnly,
  prodOnly,
  envSwitch,
  assertDevelopment,
  assertProduction,
  safePrint,
  measurePerformance,
  withDebugMiddleware,
  getCorsConfig,
  validateInput,
  getServerFeatureFlags,
  safeErrorResponse
}; 