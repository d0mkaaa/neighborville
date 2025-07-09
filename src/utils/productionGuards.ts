declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      onCommitFiberRoot?: (...args: any[]) => void;
      onCommitFiberUnmount?: (...args: any[]) => void;
    };
    __REDUX_DEVTOOLS_EXTENSION__?: any;
  }
}

export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

export const devOnly = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: any[]) => {
    if (isDevelopment()) {
      return fn(...args);
    }
    return undefined;
  }) as T;
};

export const prodOnly = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: any[]) => {
    if (isProduction()) {
      return fn(...args);
    }
    return undefined;
  }) as T;
};

export const envSwitch = <T>(devFn: () => T, prodFn: () => T): T => {
  return isDevelopment() ? devFn() : prodFn();
};

export const disableDebugInProduction = (): void => {
  if (isProduction()) {
    const noop = () => {};
    if (typeof window !== 'undefined') {
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = noop;
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = noop;
      }
      if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        window.__REDUX_DEVTOOLS_EXTENSION__ = undefined;
      }
    }
  }
};

export const assertDevelopment = (message?: string): void => {
  if (isProduction()) {
    throw new Error(message || 'This operation is only allowed in development environment');
  }
};

export const assertProduction = (message?: string): void => {
  if (isDevelopment()) {
    throw new Error(message || 'This operation is only allowed in production environment');
  }
};

export const withDebug = <T extends object>(obj: T, debugProps: object): T => {
  if (isDevelopment()) {
    return { ...obj, ...debugProps };
  }
  return obj;
};

export const measurePerformance = <T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T => {
  if (isDevelopment()) {
    return ((...args: any[]) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      console.log(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
      return result;
    }) as T;
  }
  return fn;
};

export const safeInspect = (obj: any, depth: number = 2): any => {
  if (isDevelopment()) {
    return obj;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    if (depth <= 0) return '[Object]';
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key')) {
        sanitized[key] = '[HIDDEN]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = safeInspect(value, depth - 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return obj;
};

export const getApiEndpoint = (endpoint: string): string => {
  const baseUrl = envSwitch(
    () => 'http://localhost:3001',
    () => window.location.origin
  );
  
  return `${baseUrl}${endpoint}`;
};

export interface FeatureFlags {
  enableDebugPanel: boolean;
  enablePerformanceMetrics: boolean;
  enableDetailedErrorReporting: boolean;
  enableTestingTools: boolean;
}

export const getFeatureFlags = (): FeatureFlags => {
  return {
    enableDebugPanel: isDevelopment(),
    enablePerformanceMetrics: isDevelopment(),
    enableDetailedErrorReporting: isDevelopment(),
    enableTestingTools: isDevelopment()
  };
};

export default {
  isProduction,
  isDevelopment,
  devOnly,
  prodOnly,
  envSwitch,
  disableDebugInProduction,
  assertDevelopment,
  assertProduction,
  withDebug,
  measurePerformance,
  safeInspect,
  getApiEndpoint,
  getFeatureFlags
}; 