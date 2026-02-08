/**
 * Logger Utility
 * 
 * Environment-aware logging to keep production console clean
 * while maintaining helpful debug output in development.
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const isDevelopment = (import.meta as any).env?.DEV || process.env.NODE_ENV === 'development';


/**
 * Logger class with environment-aware output
 */
class Logger {
    private prefix: string;

    constructor(prefix: string = '[App]') {
        this.prefix = prefix;
    }

    /**
     * Log general information (development only)
     */
    log(...args: any[]): void {
        if (isDevelopment) {
            console.log(this.prefix, ...args);
        }
    }

    /**
     * Log informational messages (development only)
     */
    info(...args: any[]): void {
        if (isDevelopment) {
            console.info(this.prefix, ...args);
        }
    }

    /**
     * Log warnings (always shown)
     */
    warn(...args: any[]): void {
        console.warn(this.prefix, ...args);
    }

    /**
     * Log errors (always shown)
     */
    error(...args: any[]): void {
        console.error(this.prefix, ...args);
    }

    /**
     * Log debug information (development only)
     */
    debug(...args: any[]): void {
        if (isDevelopment) {
            console.debug(this.prefix, ...args);
        }
    }

    /**
     * Group logs together (development only)
     */
    group(label: string): void {
        if (isDevelopment) {
            console.group(this.prefix, label);
        }
    }

    /**
     * End log group (development only)
     */
    groupEnd(): void {
        if (isDevelopment) {
            console.groupEnd();
        }
    }

    /**
     * Time a code block (development only)
     */
    time(label: string): void {
        if (isDevelopment) {
            console.time(`${this.prefix} ${label}`);
        }
    }

    /**
     * End timing a code block (development only)
     */
    timeEnd(label: string): void {
        if (isDevelopment) {
            console.timeEnd(`${this.prefix} ${label}`);
        }
    }

    /**
     * Create a child logger with a different prefix
     */
    child(suffix: string): Logger {
        return new Logger(`${this.prefix}:${suffix}`);
    }
}

// Default logger instance
export const logger = new Logger('[GoSimpleLiving]');

// Specialized loggers for different parts of the app
export const dbLogger = logger.child('DB');
export const aiLogger = logger.child('AI');
export const analyticsLogger = logger.child('Analytics');
export const authLogger = logger.child('Auth');

export default logger;
