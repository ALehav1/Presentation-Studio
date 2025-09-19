// Debug utilities for safe logging in production
// These functions only log in development mode to keep production console clean

/**
 * Safe debug logging that only appears in development
 */
export const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

/**
 * Safe info logging for important information
 */
export const debugInfo = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.info(`ℹ️ ${message}`, ...args);
  }
};

/**
 * Safe warning logging
 */
export const debugWarn = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`⚠️ ${message}`, ...args);
  }
};

/**
 * Always log errors (even in production) with context
 */
export const logError = (message: string, error: any, context?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ${message}:`, error);
  
  if (context && process.env.NODE_ENV === 'development') {
    console.error('Context:', context);
  }
};

/**
 * Performance timing for development
 */
export const debugTime = (label: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.time(`⏱️ ${label}`);
  }
};

/**
 * End performance timing for development
 */
export const debugTimeEnd = (label: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.timeEnd(`⏱️ ${label}`);
  }
};

/**
 * Feature-specific debug logging with namespace
 */
export const createDebugger = (namespace: string) => ({
  log: (...args: any[]) => debug(`[${namespace}]`, ...args),
  info: (message: string, ...args: any[]) => debugInfo(`[${namespace}] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => debugWarn(`[${namespace}] ${message}`, ...args),
  error: (message: string, error: any, context?: any) => logError(`[${namespace}] ${message}`, error, context),
  time: (label: string) => debugTime(`[${namespace}] ${label}`),
  timeEnd: (label: string) => debugTimeEnd(`[${namespace}] ${label}`),
});

/**
 * Conditional debug based on feature flags
 */
export const debugFeature = (feature: string, enabled: boolean) => ({
  log: (...args: any[]) => {
    if (enabled && process.env.NODE_ENV === 'development') {
      console.log(`[${feature}]`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (enabled && process.env.NODE_ENV === 'development') {
      console.info(`[${feature}] ℹ️ ${message}`, ...args);
    }
  }
});
