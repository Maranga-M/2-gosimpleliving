import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console
    console.error('Error caught by Error Boundary:', error);

    // Check if it's a chunk loading error (common in Vercel after new deployments)
    const isChunkError = /Failed to fetch dynamically imported module|chunkLoadError|Loading chunk/i.test(error.message);

    if (isChunkError) {
      console.warn('Chunk loading error detected, attempting auto-reload...');
      const hasAutoReloaded = window.sessionStorage.getItem('chunk-error-auto-reload');

      if (!hasAutoReloaded) {
        window.sessionStorage.setItem('chunk-error-auto-reload', 'true');
        window.location.reload();
        return;
      }
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    window.sessionStorage.removeItem('chunk-error-auto-reload');
    window.sessionStorage.removeItem('page-has-been-force-refreshed');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Oops! Something went wrong
              </h1>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
              Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <summary className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                <RefreshCw size={18} />
                Reload Page
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
