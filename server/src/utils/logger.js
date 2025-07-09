const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class ServerLogger {
  constructor() {
    this.isDevelopment = isDevelopment;
    this.isProduction = isProduction;
    this.enabledLevels = isDevelopment ? 
      ['debug', 'info', 'warn', 'error'] : 
      ['warn', 'error'];
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (typeof message === 'string') {
      return `${prefix} ${message}`;
    }
    return prefix;
  }

  cleanArgsForProduction(...args) {
    if (this.isDevelopment) {
      return args;
    }
    
    return args.map(arg => {
      if (typeof arg === 'string') {
        return arg.replace(/[🔍📧📝✅📋🆕♻️❌🚀🏠💬📤📥🔐🔄🛡️🚫⚠️]/g, '');
      }
      if (typeof arg === 'object' && arg !== null) {
        if (arg.password || arg.token || arg.secret || arg.key) {
          return { ...arg, password: '[REDACTED]', token: '[REDACTED]', secret: '[REDACTED]', key: '[REDACTED]' };
        }
        return arg;
      }
      return arg;
    });
  }

  shouldLog(level) {
    return this.enabledLevels.includes(level);
  }

  debug(message, ...args) {
    if (this.shouldLog('debug')) {
      const cleanArgs = this.cleanArgsForProduction(...args);
      console.log(this.formatMessage('debug', message), ...cleanArgs);
    }
  }

  info(message, ...args) {
    if (this.shouldLog('info')) {
      const cleanArgs = this.cleanArgsForProduction(...args);
      console.log(this.formatMessage('info', message), ...cleanArgs);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      const cleanArgs = this.cleanArgsForProduction(...args);
      console.warn(this.formatMessage('warn', message), ...cleanArgs);
    }
  }

  error(message, ...args) {
    if (this.shouldLog('error')) {
      const cleanArgs = this.cleanArgsForProduction(...args);
      console.error(this.formatMessage('error', message), ...cleanArgs);
    }
  }

  api(message, ...args) {
    this.info(`[API] ${message}`, ...args);
  }

  socket(message, ...args) {
    this.debug(`[SOCKET] ${message}`, ...args);
  }

  auth(message, ...args) {
    this.info(`[AUTH] ${message}`, ...args);
  }

  security(message, ...args) {
    this.warn(`[SECURITY] ${message}`, ...args);
  }

  database(message, ...args) {
    this.debug(`[DB] ${message}`, ...args);
  }

  production(message, ...args) {
    const cleanArgs = this.cleanArgsForProduction(...args);
    console.log(this.formatMessage('production', message), ...cleanArgs);
  }

  silent(level, message, ...args) {
    if (this.isProduction) {
      return;
    }
    this[level](message, ...args);
  }
}

export const logger = new ServerLogger(); 