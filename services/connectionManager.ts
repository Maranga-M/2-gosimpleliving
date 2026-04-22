/**
 * Connection Manager
 * Centralized database connection state management with:
 * - Consecutive failure threshold (3 failures before "offline")
 * - Escalating recovery backoff (30s -> 60s -> 120s -> 300s)
 * - Tab visibility-aware reconnection
 * - Session revalidation on tab return
 */

export type ConnectionStatus = 'connected' | 'offline' | 'loading' | 'reconnecting';

export type ConnectionErrorType =
    | 'network'
    | 'auth'
    | 'schema'
    | 'timeout'
    | 'unknown';

export interface ConnectionState {
    status: ConnectionStatus;
    lastSuccessfulConnection: number | null;
    lastError: string | null;
    errorType: ConnectionErrorType | null;
    retryCount: number;
    consecutiveFailures: number;
    isBackgroundReconnecting: boolean;
}

export interface ConnectionConfig {
    initialTimeout: number;
    retryTimeout: number;
    maxRetries: number;
    retryDelay: number;
    baseBackoffInterval: number;
    maxBackoffInterval: number;
    consecutiveFailureThreshold: number;
    healthCheckInterval: number;
}

const DEFAULT_CONFIG: ConnectionConfig = {
    initialTimeout: 45000,
    retryTimeout: 20000,
    maxRetries: 3,
    retryDelay: 2000,
    baseBackoffInterval: 30000,       // 30s first retry (was 5 min)
    maxBackoffInterval: 300000,        // Cap at 5 min
    consecutiveFailureThreshold: 3,    // 3 failures before "offline"
    healthCheckInterval: 45000         // 45s health check
};

class ConnectionManager {
    private state: ConnectionState;
    private config: ConnectionConfig;
    private backgroundRetryTimer: ReturnType<typeof setTimeout> | null = null;
    private backgroundRetryAttempt: number = 0;
    private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
    private healthCheckHandler: (() => Promise<boolean>) | null = null;
    private sessionRevalidator: (() => Promise<void>) | null = null;
    private listeners: Set<(state: ConnectionState) => void> = new Set();
    private visibilityHandler: (() => void) | null = null;

    constructor(config?: Partial<ConnectionConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        const cached = this.loadCachedState();
        this.state = cached || {
            status: 'loading',
            lastSuccessfulConnection: null,
            lastError: null,
            errorType: null,
            retryCount: 0,
            consecutiveFailures: 0,
            isBackgroundReconnecting: false
        };

        // Set up tab visibility listener
        if (typeof document !== 'undefined') {
            this.visibilityHandler = () => {
                if (document.visibilityState === 'visible') {
                    this.onTabVisible();
                }
            };
            document.addEventListener('visibilitychange', this.visibilityHandler);
        }

        if (this.state.status === 'connected') {
            this.startHealthCheck();
        }
    }

    /**
     * Register a health check handler (called by database.ts)
     */
    setHealthCheckHandler(handler: () => Promise<boolean>) {
        this.healthCheckHandler = handler;
    }

    /**
     * Register a session revalidation handler (called by database.ts)
     */
    setSessionRevalidator(handler: () => Promise<void>) {
        this.sessionRevalidator = handler;
    }

    /**
     * Called when the browser tab becomes visible again.
     * Immediately revalidates session and checks connection health.
     */
    private async onTabVisible() {
        // Revalidate auth session
        if (this.sessionRevalidator) {
            try {
                await this.sessionRevalidator();
            } catch (e) {
                console.warn('[ConnectionManager] Session revalidation failed on tab return:', e);
            }
        }

        // Immediate health check (don't wait for next interval)
        if (this.healthCheckHandler && this.state.status !== 'reconnecting') {
            try {
                const isHealthy = await this.healthCheckHandler();
                if (isHealthy) {
                    this.state.consecutiveFailures = 0;
                    if (this.state.status !== 'connected') {
                        this.markConnected();
                    } else {
                        this.state.lastSuccessfulConnection = Date.now();
                        this.cacheState();
                    }
                } else {
                    this.incrementConsecutiveFailure();
                }
            } catch {
                this.incrementConsecutiveFailure();
            }
        }
    }

    /**
     * Increment consecutive failure count.
     * Only transition to "offline" after threshold is reached.
     */
    private incrementConsecutiveFailure() {
        this.state.consecutiveFailures++;
        if (this.state.consecutiveFailures >= this.config.consecutiveFailureThreshold) {
            if (this.state.status !== 'offline' && this.state.status !== 'reconnecting') {
                this.markFailed(new Error('Connection lost (multiple consecutive health check failures)'));
            }
        }
    }

    /**
     * Start health check polling (only when connected)
     */
    startHealthCheck() {
        if (this.healthCheckTimer) return;

        this.healthCheckTimer = setInterval(async () => {
            // Skip if already reconnecting or page is hidden
            if (this.state.status === 'reconnecting' || this.state.isBackgroundReconnecting) return;
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

            if (this.healthCheckHandler) {
                try {
                    const isHealthy = await this.healthCheckHandler();
                    if (isHealthy) {
                        this.state.consecutiveFailures = 0;
                        this.state.lastSuccessfulConnection = Date.now();
                        this.cacheState();
                    } else {
                        this.incrementConsecutiveFailure();
                    }
                } catch {
                    this.incrementConsecutiveFailure();
                }
            }
        }, this.config.healthCheckInterval);
    }

    /**
     * Stop health check polling
     */
    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }

    /**
     * Get current connection state (copy)
     */
    getState(): ConnectionState {
        return { ...this.state };
    }

    /**
     * Subscribe to connection state changes
     */
    subscribe(listener: (state: ConnectionState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private updateState(updates: Partial<ConnectionState>) {
        this.state = { ...this.state, ...updates };
        this.cacheState();
        this.notifyListeners();
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    private cacheState() {
        try {
            const cacheData = {
                lastSuccessfulConnection: this.state.lastSuccessfulConnection,
                status: this.state.status === 'connected' ? 'connected' : 'offline'
            };
            localStorage.setItem('gsl_connection_state', JSON.stringify(cacheData));
        } catch (e) {
            // Ignore
        }
    }

    private loadCachedState(): ConnectionState | null {
        try {
            const cached = localStorage.getItem('gsl_connection_state');
            if (!cached) return null;

            const data = JSON.parse(cached);
            return {
                status: 'loading',
                lastSuccessfulConnection: data.lastSuccessfulConnection,
                lastError: null,
                errorType: null,
                retryCount: 0,
                consecutiveFailures: 0,
                isBackgroundReconnecting: false
            };
        } catch (e) {
            return null;
        }
    }

    private categorizeError(error: any): ConnectionErrorType {
        const message = error?.message?.toLowerCase() || '';

        if (message.includes('timeout') || message.includes('timed out')) return 'timeout';
        if (message.includes('paused') || message.includes('503') || message.includes('disabled')) return 'network';
        if (message.includes('auth') || message.includes('unauthorized') || message.includes('invalid') || message.includes('credentials')) return 'auth';
        if (message.includes('table') || message.includes('schema') || message.includes('relation') || message.includes('does not exist')) return 'schema';
        if (message.includes('network') || message.includes('fetch') || message.includes('cors')) return 'network';

        return 'unknown';
    }

    getErrorMessage(errorType: ConnectionErrorType, originalError?: string): string {
        switch (errorType) {
            case 'timeout':
                return 'Connection timed out. Database may be sleeping (cold start) or network is slow.';
            case 'auth':
                return 'Authentication failed. Please check your Supabase credentials in the .env file.';
            case 'schema':
                return 'Database schema error. Please run migrations or check that all required tables exist.';
            case 'network':
                if (originalError?.toLowerCase().includes('paused')) {
                    return 'Database project is paused due to inactivity. Access the Supabase dashboard to restore it.';
                }
                return 'Network error. Please check your internet connection and firewall settings.';
            case 'unknown':
            default:
                return originalError || 'Failed to connect to database. Please check your configuration.';
        }
    }

    /**
     * Mark connection as successful
     */
    markConnected() {
        this.stopBackgroundReconnection();
        this.startHealthCheck();
        this.updateState({
            status: 'connected',
            lastSuccessfulConnection: Date.now(),
            lastError: null,
            errorType: null,
            retryCount: 0,
            consecutiveFailures: 0,
            isBackgroundReconnecting: false
        });
    }

    /**
     * Mark connection as failed
     */
    markFailed(error: any) {
        this.stopHealthCheck();
        const errorType = this.categorizeError(error);
        const errorMessage = this.getErrorMessage(errorType, error?.message);

        this.updateState({
            status: 'offline',
            lastError: errorMessage,
            errorType,
            consecutiveFailures: 0,
            isBackgroundReconnecting: false
        });

        // Start background reconnection for recoverable errors
        if (errorType !== 'auth' && errorType !== 'schema') {
            this.startBackgroundReconnection();
        }
    }

    markLoading() {
        this.updateState({ status: 'loading' });
    }

    markReconnecting() {
        this.updateState({ status: 'reconnecting' });
    }

    incrementRetry() {
        this.updateState({ retryCount: this.state.retryCount + 1 });
    }

    reset() {
        this.updateState({
            retryCount: 0,
            lastError: null,
            errorType: null,
            consecutiveFailures: 0
        });
    }

    shouldRetry(): boolean {
        return this.state.retryCount < this.config.maxRetries;
    }

    getTimeout(): number {
        return this.state.retryCount === 0
            ? this.config.initialTimeout
            : this.config.retryTimeout;
    }

    getRetryDelay(): number {
        return this.config.retryDelay * Math.pow(2, this.state.retryCount);
    }

    /**
     * Start background reconnection with escalating backoff:
     * 30s -> 60s -> 120s -> 300s (cap)
     */
    private startBackgroundReconnection() {
        if (this.backgroundRetryTimer) return;

        this.backgroundRetryAttempt = 0;
        this.updateState({ isBackgroundReconnecting: true });
        this.scheduleNextBackgroundRetry();
    }

    private scheduleNextBackgroundRetry() {
        const delay = Math.min(
            this.config.baseBackoffInterval * Math.pow(2, this.backgroundRetryAttempt),
            this.config.maxBackoffInterval
        );

        this.backgroundRetryTimer = setTimeout(async () => {
            this.backgroundRetryTimer = null;

            if (this.state.status === 'connected') {
                this.stopBackgroundReconnection();
                return;
            }

            if (this.healthCheckHandler) {
                try {
                    const isHealthy = await this.healthCheckHandler();
                    if (isHealthy) {
                        this.markConnected();
                        return;
                    }
                } catch {
                    // Still offline
                }
            }

            this.backgroundRetryAttempt++;
            this.scheduleNextBackgroundRetry();
        }, delay);
    }

    private stopBackgroundReconnection() {
        if (this.backgroundRetryTimer) {
            clearTimeout(this.backgroundRetryTimer);
            this.backgroundRetryTimer = null;
        }
        this.backgroundRetryAttempt = 0;
        if (this.state.isBackgroundReconnecting) {
            this.updateState({ isBackgroundReconnecting: false });
        }
    }

    triggerBackgroundReconnection() {
        this.stopBackgroundReconnection();
        this.startBackgroundReconnection();
    }

    destroy() {
        this.stopBackgroundReconnection();
        this.stopHealthCheck();
        if (this.visibilityHandler && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        this.listeners.clear();
    }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
