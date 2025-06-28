const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    } else {
      const cleanArgs = args.map(arg => 
        typeof arg === 'string' ? arg.replace(/[🔍📧📝✅📋🆕♻️❌]/g, '') : arg
      );
      console.log(...cleanArgs);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    } else {
      const cleanArgs = args.map(arg => 
        typeof arg === 'string' ? arg.replace(/[🔍📧📝✅📋🆕♻️❌]/g, '') : arg
      );
      console.warn(...cleanArgs);
    }
  },
  
  error: (...args) => {
    console.error(...args);
  }
}; 