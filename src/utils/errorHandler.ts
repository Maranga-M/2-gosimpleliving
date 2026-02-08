/**
 * Centralized Error Handling Utilities
 * 
 * Provides consistent error handling across the application
 * with severity levels and user-friendly messaging.
 */

// For now, we'll use basic alerts, but this can be replaced with a toast library
import toast from 'react-hot-toast';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Custom application error class
 */
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public severity: ErrorSeverity = 'error',
        public originalError?: unknown
    ) {
        super(message);
        this.name = 'AppError';

        // Maintain proper stack trace for where our error was thrown (only in V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
    // Database errors
    DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
    DB_QUERY_FAILED: 'DB_QUERY_FAILED',
    DB_NOT_CONFIGURED: 'DB_NOT_CONFIGURED',

    // Validation errors
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    INVALID_INPUT: 'INVALID_INPUT',

    // Authentication errors
    AUTH_FAILED: 'AUTH_FAILED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // API errors
    API_ERROR: 'API_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

    // General errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    NOT_FOUND: 'NOT_FOUND',
} as const;

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<string, string> = {
    [ERROR_CODES.DB_CONNECTION_FAILED]: 'Unable to connect to the database. Please check your internet connection.',
    [ERROR_CODES.DB_NOT_CONFIGURED]: 'Database is not configured. Please check Settings.',
    [ERROR_CODES.VALIDATION_FAILED]: 'Please check your input and try again.',
    [ERROR_CODES.AUTH_FAILED]: 'Authentication failed. Please check your credentials.',
    [ERROR_CODES.UNAUTHORIZED]: 'You do not have permission to perform this action.',
    [ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
    [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your internet connection.',
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
    [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Get user-friendly error message from error code
 */
export const getErrorMessage = (code: string, fallback?: string): string => {
    return ERROR_MESSAGES[code] || fallback || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
};

/**
 * Handle errors consistently across the application
 * 
 * @param error - Error object or unknown error
 * @param context - Optional context for debugging
 */
export const handleError = (error: unknown, context?: string): void => {
    console.error(`[Error Handler]${context ? ` [${context}]` : ''}`, error);

    let message: string;
    let severity: ErrorSeverity = 'error';

    if (error instanceof AppError) {
        message = error.message;
        severity = error.severity;

        // Log to error tracking service for critical errors
        if (severity === 'critical') {
            logCriticalError(error);
        }
    } else if (error instanceof Error) {
        message = error.message || getErrorMessage(ERROR_CODES.UNKNOWN_ERROR);
    } else if (typeof error === 'string') {
        message = error;
    } else {
        message = getErrorMessage(ERROR_CODES.UNKNOWN_ERROR);
    }

    // Display to user (toast)
    if (severity === 'critical' || severity === 'error') {
        toast.error(message);
    } else if (severity === 'warning') {
        toast(message, { icon: '⚠️' });
    }
};

/**
 * Log critical errors (placeholder for future error tracking service integration)
 */
const logCriticalError = (error: AppError): void => {
    console.error('[CRITICAL ERROR]', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        originalError: error.originalError,
        timestamp: new Date().toISOString(),
    });

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
};

/**
 * Wrap async functions with error handling
 * 
 * @example
 * ```typescript
 * const safeFunction = withErrorHandling(
 *   async () => {
 *     // your async code
 *   },
 *   'Loading products'
 * );
 * ```
 */
export const withErrorHandling = <T>(
    fn: () => Promise<T>,
    context?: string
): Promise<T | undefined> => {
    return fn().catch((error) => {
        handleError(error, context);
        return undefined;
    });
};

/**
 * Assert a condition and throw an AppError if false
 */
export const assert = (
    condition: boolean,
    message: string,
    code: string = ERROR_CODES.UNKNOWN_ERROR,
    severity: ErrorSeverity = 'error'
): asserts condition => {
    if (!condition) {
        throw new AppError(message, code, severity);
    }
};

/**
 * Parse error from Supabase response
 */
export const parseSupabaseError = (error: any): AppError => {
    const message = error?.message || 'Database operation failed';
    const code = error?.code || ERROR_CODES.DB_QUERY_FAILED;

    return new AppError(
        message,
        code,
        'error',
        error
    );
};

/**
 * Parse error from Gemini API response
 */
export const parseGeminiError = (error: any): AppError => {
    const message = error?.message || 'AI service error';
    const code = ERROR_CODES.API_ERROR;

    // Check for rate limiting
    if (error?.status === 429 || message.includes('quota') || message.includes('rate limit')) {
        return new AppError(
            'AI request rate limit exceeded. Please wait a moment.',
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            'warning',
            error
        );
    }

    return new AppError(message, code, 'error', error);
};

/**
 * Create a validation error
 */
export const createValidationError = (errors: string[]): AppError => {
    const message = errors.length > 0
        ? `Validation failed:\n• ${errors.join('\n• ')}`
        : 'Validation failed';

    return new AppError(
        message,
        ERROR_CODES.VALIDATION_FAILED,
        'warning'
    );
};

/**
 * Success message handler (for consistency)
 */
export const handleSuccess = (message: string): void => {
    console.log('[Success]', message);
    toast.success(message);
};
