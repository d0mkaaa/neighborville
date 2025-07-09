type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  isDevelopment: boolean;
  enableConsole: boolean;
  enableProductionErrors: boolean;
  maxLogLevel: LogLevel;
}

class FrontendLogger {
  private config: LoggerConfig;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor() {
    this.config = {
      isDevelopment: import.meta.env.DEV,
      enableConsole: import.meta.env.DEV,
      enableProductionErrors: true,
      maxLogLevel: import.meta.env.DEV ? 'debug' : 'error'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enableConsole && level !== 'error') {
      return false;
    }
    
    if (!this.config.isDevelopment && level !== 'error' && !this.config.enableProductionErrors) {
      return false;
    }

    return this.logLevels[level] >= this.logLevels[this.config.maxLogLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.isDevelopment ? 
      `[${timestamp}] [${level.toUpperCase()}]` : 
      `[${level.toUpperCase()}]`;
    
    return `${prefix} ${message}`;
  }

  private cleanArgsForProduction(...args: any[]): any[] {
    if (this.config.isDevelopment) {
      return args;
    }
    
    return args.map(arg => {
      if (typeof arg === 'string') {
        return arg.replace(/[🔍📧📝✅📋🆕♻️❌🚀🏠💬📤📥🔐🔄🛡️🚫⚠️]/g, '');
      }
      if (typeof arg === 'object' && arg !== null) {
        return '[Object]';
      }
      return arg;
    });
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      const cleanArgs = this.cleanArgsForProduction(...args);
      console.log(this.formatMessage('debug', message), ...cleanArgs);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      const cleanArgs = this.cleanArgsForProduction(...args);
      console.log(this.formatMessage('info', message), ...cleanArgs);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      const cleanArgs = this.cleanArgsForProduction(...args);
      console.warn(this.formatMessage('warn', message), ...cleanArgs);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const cleanArgs = this.cleanArgsForProduction(...args);
      console.error(this.formatMessage('error', message), ...cleanArgs);
    }
  }

  api(message: string, ...args: any[]): void {
    this.debug(`[API] ${message}`, ...args);
  }

  socket(message: string, ...args: any[]): void {
    this.debug(`[SOCKET] ${message}`, ...args);
  }

  auth(message: string, ...args: any[]): void {
    this.debug(`[AUTH] ${message}`, ...args);
  }

  chat(message: string, ...args: any[]): void {
    this.debug(`[CHAT] ${message}`, ...args);
  }

  game(message: string, ...args: any[]): void {
    this.debug(`[GAME] ${message}`, ...args);
  }

  security(message: string, ...args: any[]): void {
    this.warn(`[SECURITY] ${message}`, ...args);
  }

  disableConsoleInProduction(): void {
    if (!this.config.isDevelopment) {
      this.config.enableConsole = false;
    }
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

export const logger = new FrontendLogger();

if (!import.meta.env.DEV) {
  logger.disableConsoleInProduction();
}

export const console_dev = {
  log: (...args: any[]) => logger.debug('', ...args),
  warn: (...args: any[]) => logger.warn('', ...args),
  error: (...args: any[]) => logger.error('', ...args),
  info: (...args: any[]) => logger.info('', ...args)
};

export default logger; 