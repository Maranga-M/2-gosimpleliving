/**
 * Connection Manager
 * Centralized database connection state management with caching and health monitoring
 */

export type ConnectionStatus = 'connected' | 'offline' | 'loading' | 'reconnecting';

export type ConnectionErrorType =
    | 'network'      // Network connectivity issues
    | 'auth'         // Invalid credentials
    | 'schema'       // Missing tables or schema issues
    | 'timeout'      // Connection timeout
    | 'unknown';     // Unknown error

export interface ConnectionState {
    status: ConnectionStatus;
    lastSuccessfulConnection: number | null;
    lastError: string | null;
    errorType: ConnectionErrorType | null;
    retryCount: number;
    isBackgroundReconnecting: boolean;
}

export interface ConnectionConfig {
    initialTimeout: number;      // First attempt timeout (ms)
    retryTimeout: number;         // Subsequent attempt timeout (ms)
    maxRetries: number;           // Maximum retry attempts
    retryDelay: number;           // Delay between retries (ms)
    backgroundRetryInterval: number; // Background reconnection interval (ms)
}

const DEFAULT_CONFIG: ConnectionConfig = {
    initialTimeout: 45000,        // 45 seconds (Supabase cold starts can be slow)
    retryTimeout: 20000,          // 20 seconds
    maxRetries: 3,                // 3 total attempts
    retryDelay: 2000,             // Base delay (ms)
    backgroundRetryInterval: 300000 // 5 minutes for background retry
};

class ConnectionManager {
    private state: ConnectionState;
    private config: ConnectionConfig;
    private backgroundRetryTimer: ReturnType<typeof setTimeout> | null = null;
    private healthCheckInterval: ReturnType<typeof setTimeout> | null = null;
    private healthCheckHandler: (() => Promise<boolean>) | null = null;
    private listeners: Set<(state: ConnectionState) => void> = new Set();

    constructor(config?: Partial<ConnectionConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Try to restore last known state from localStorage
        const cached = this.loadCachedState();
        this.state = cached || {
            status: 'loading',
            lastSuccessfulConnection: null,
            lastError: null,
            errorType: null,
            retryCount: 0,
            isBackgroundReconnecting: false
        };

        // Start health check if we think we are connected
        if (this.state.status === 'connected') {
            this.startHealthCheck();
        }
    }

    /**
     * Register a health check handler
     */
    setHealthCheckHandler(handler: () => Promise<boolean>) {
        this.healthCheckHandler = handler;
    }

    /**
     * Start active health checking (heartbeat)
     */
    startHealthCheck() {
        if (this.healthCheckInterval) return;

        // Check visibility to optimize health checks
        const checkInterval = document.visibilityState === 'hidden' ? 180000 : 45000;

        this.healthCheckInterval = setInterval(async () => {
            if (this.state.status === 'reconnecting' || this.state.isBackgroundReconnecting) return;

            // Don't check if page is hidden to save connections/resources
            if (document.visibilityState === 'hidden') return;

            if (this.healthCheckHandler) {
                try {
                    const isHealthy = await this.healthCheckHandler();
                    if (isHealthy) {
                        this.state.lastSuccessfulConnection = Date.now();
                        this.cacheState();
                    } else {
                        console.warn('⚠️ Connection heartbeat failed - triggering reconnect');
                        this.handleDisconnect();
                    }
                } catch (err) {
                    console.error('❌ Error during connection heartbeat:', err);
                    this.handleDisconnect();
                }
            }
        }, checkInterval);
    }

    /**
     * Stop active health checking
     */
    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Handle a detected disconnection
     */
    private handleDisconnect() {
        if (this.state.status !== 'offline' && this.state.status !== 'reconnecting') {
            this.markFailed(new Error('Connection lost (heartbeat failed)'));
        }
    }

    /**
     * Get current connection state
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

    /**
     * Update connection state and notify listeners
     */
    private updateState(updates: Partial<ConnectionState>) {
        this.state = { ...this.state, ...updates };
        this.cacheState();
        this.notifyListeners();
    }

    /**
     * Notify all listeners of state change
     */
    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    /**
     * Cache connection state to localStorage
     */
    private cacheState() {
        try {
            const cacheData = {
                lastSuccessfulConnection: this.state.lastSuccessfulConnection,
                status: this.state.status === 'connected' ? 'connected' : 'offline'
            };
            localStorage.setItem('gsl_connection_state', JSON.stringify(cacheData));
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    /**
     * Load cached connection state from localStorage
     */
    private loadCachedState(): ConnectionState | null {
        try {
            const cached = localStorage.getItem('gsl_connection_state');
            if (!cached) return null;

            const data = JSON.parse(cached);
            const timeSinceLastConnection = data.lastSuccessfulConnection
                ? Date.now() - data.lastSuccessfulConnection
                : Infinity;

            // If last connection was within 5 minutes, assume we might still be connected
            const assumeConnected = timeSinceLastConnection < 5 * 60 * 1000;

            return {
                status: assumeConnected ? 'loading' : 'offline',
                lastSuccessfulConnection: data.lastSuccessfulConnection,
                lastError: null,
                errorType: null,
                retryCount: 0,
                isBackgroundReconnecting: false
            };
        } catch (e) {
            return null;
        }
    }

    /**
     * Categorize error type based on error message
     */
    private categorizeError(error: any): ConnectionErrorType {
        const message = error?.message?.toLowerCase() || '';

        if (message.includes('timeout') || message.includes('timed out')) {
            return 'timeout';
        }
        if (message.includes('paused') || message.includes('503') || message.includes('disabled')) {
            return 'network'; // Project paused is a network-level issue for the client
        }
        if (message.includes('auth') || message.includes('unauthorized') || message.includes('invalid') || message.includes('credentials')) {
            return 'auth';
        }
        if (message.includes('table') || message.includes('schema') || message.includes('relation') || message.includes('does not exist')) {
            return 'schema';
        }
        if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
            return 'network';
        }

        return 'unknown';
    }

    /**
     * Get user-friendly error message based on error type
     */
    getErrorMessage(errorType: ConnectionErrorType, originalError?: string): string {
        const rawMsg = originalError ? ` (Raw: ${originalError})` : '';
        switch (errorType) {
            case 'timeout':
                return 'Connection timed out. Database may be sleeping (cold start) or network is slow.' + rawMsg;
            case 'auth':
                return 'Authentication failed. Please check your Supabase credentials in the .env file.' + rawMsg;
            case 'schema':
                return 'Database schema error. Please run migrations or check that all required tables exist.' + rawMsg;
            case 'network':
                if (originalError?.toLowerCase().includes('paused')) {
                    return 'Database project is paused due to inactivity. Access the Supabase dashboard to restore it.';
                }
                return 'Network error. Please check your internet connection and firewall settings.' + rawMsg;
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
        this.startHealthCheck(); // Start monitoring
        this.updateState({
            status: 'connected',
            lastSuccessfulConnection: Date.now(),
            lastError: null,
            errorType: null,
            retryCount: 0,
            isBackgroundReconnecting: false
        });
    }

    /**
     * Mark connection as failed
     */
    markFailed(error: any) {
        this.stopHealthCheck(); // Stop monitoring while broken
        const errorType = this.categorizeError(error);
        const errorMessage = this.getErrorMessage(errorType, error?.message);

        this.updateState({
            status: 'offline',
            lastError: errorMessage,
            errorType,
            isBackgroundReconnecting: false
        });

        // Start background reconnection for non-auth errors
        if (errorType !== 'auth' && errorType !== 'schema') {
            this.startBackgroundReconnection();
        }
    }

    /**
     * Mark connection as loading
     */
    markLoading() {
        this.updateState({
            status: 'loading'
        });
    }

    /**
     * Mark connection as reconnecting
     */
    markReconnecting() {
        this.updateState({
            status: 'reconnecting'
        });
    }

    /**
     * Increment retry count
     */
    incrementRetry() {
        this.updateState({
            retryCount: this.state.retryCount + 1
        });
    }

    /**
     * Reset retry count and errors
     */
    reset() {
        this.updateState({
            retryCount: 0,
            lastError: null,
            errorType: null
        });
    }

    /**
     * Check if should retry based on current state
     */
    shouldRetry(): boolean {
        return this.state.retryCount < this.config.maxRetries;
    }

    /**
     * Get timeout for current attempt
     */
    getTimeout(): number {
        return this.state.retryCount === 0
            ? this.config.initialTimeout
            : this.config.retryTimeout;
    }

    /**
     * Get retry delay with exponential backoff
     */
    getRetryDelay(): number {
        // Exponential backoff: base * 2 ^ attempt
        return this.config.retryDelay * Math.pow(2, this.state.retryCount);
    }

    /**
     * Start background reconnection attempts
     */
    private startBackgroundReconnection() {
        if (this.backgroundRetryTimer) return;

        this.updateState({ isBackgroundReconnecting: true });

        this.backgroundRetryTimer = setInterval(() => {
            if (this.state.status === 'connected') {
                this.stopBackgroundReconnection();
            }
        }, this.config.backgroundRetryInterval);
    }

    /**
     * Stop background reconnection
     */
    private stopBackgroundReconnection() {
        if (this.backgroundRetryTimer) {
            clearInterval(this.backgroundRetryTimer);
            this.backgroundRetryTimer = null;
        }
        if (this.state.isBackgroundReconnecting) {
            this.updateState({ isBackgroundReconnecting: false });
        }
    }

    /**
     * Manually trigger background reconnection
     */
    triggerBackgroundReconnection() {
        this.stopBackgroundReconnection();
        this.startBackgroundReconnection();
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopBackgroundReconnection();
        this.stopHealthCheck();
        this.listeners.clear();
    }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
