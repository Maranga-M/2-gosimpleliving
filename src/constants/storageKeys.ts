/**
 * Storage Keys Constants
 * 
 * Centralized location for all localStorage and sessionStorage keys
 * to prevent typos and make refactoring easier.
 */

export const STORAGE_KEYS = {
    // User session
    USER_SESSION: 'gsl_user_session',

    // Dark mode preference
    DARK_MODE: 'gsl_dark_mode',

    // Admin override (development only)
    ADMIN_OVERRIDE: 'admin_override',

    // Site customization
    SITE_NAME: 'site_name',
    SITE_LOGO_URL: 'site_logo_url',

    // Analytics
    TRAFFIC_SOURCE: 'gsl_traffic_source',

    // Last click tracking (for anti-spam)
    LAST_CLICK_PREFIX: 'last_click_',
} as const;

/**
 * Helper to get last click key for a product
 */
export const getLastClickKey = (productId: string): string => {
    return `${STORAGE_KEYS.LAST_CLICK_PREFIX}${productId}`;
};
