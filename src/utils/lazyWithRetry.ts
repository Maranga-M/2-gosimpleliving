import { ComponentType, lazy } from 'react';

/**
 * A wrapper around React.lazy that implements a retry mechanism for handling
 * "Failed to fetch dynamically imported module" errors (chunk load errors).
 * 
 * This often happens when a new version of the site is deployed and the browser
 * still has an old index.html referencing old, now-deleted JS chunks.
 * 
 * @param componentImport A function that returns a dynamic import promise.
 * @returns A lazy-loaded component with retry logic.
 */
export const lazyWithRetry = (
    componentImport: () => Promise<{ default: ComponentType<any> }>
) =>
    lazy(async () => {
        const pageHasBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );

        try {
            return await componentImport();
        } catch (error) {
            // If we haven't refreshed yet, try once
            if (!pageHasBeenForceRefreshed) {
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                window.location.reload();
                // Return a never-resolving promise to satisfy types since page is reloading
                return new Promise(() => { });
            }

            // If we already refreshed and it still fails, bubble the error up to the ErrorBoundary
            throw error;
        }
    });
