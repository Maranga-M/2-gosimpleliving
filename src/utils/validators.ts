import { Product, BlogPost } from '../types';

/**
 * Validation Utilities
 * 
 * Provides input validation and sanitization functions to prevent
 * XSS attacks, SQL injection, and data corruption.
 */

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a URL string
 */
export const isValidUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    return URL_REGEX.test(url.trim());
};

/**
 * Validates an email string
 */
export const isValidEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
};

/**
 * Sanitizes HTML to prevent XSS attacks
 * Basic implementation - for production, use DOMPurify library
 */
export const sanitizeHtml = (html: string): string => {
    if (!html || typeof html !== 'string') return '';

    // Remove script tags and event handlers
    let sanitized = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        .replace(/javascript:/gi, '');

    return sanitized;
};

/**
 * Validates a Product object
 * 
 * @param product - Partial product data to validate
 * @returns Array of error messages (empty if valid)
 */
export const validateProduct = (product: Partial<Product>): string[] => {
    const errors: string[] = [];

    // Title validation
    if (!product.title || product.title.trim().length < 3) {
        errors.push('Title must be at least 3 characters long');
    }
    if (product.title && product.title.length > 200) {
        errors.push('Title must be less than 200 characters');
    }

    // Price validation
    if (product.price === undefined || product.price === null) {
        errors.push('Price is required');
    } else if (product.price < 0) {
        errors.push('Price must be a positive number');
    } else if (product.price > 1000000) {
        errors.push('Price seems unreasonably high (max: $1,000,000)');
    }

    // Original price validation
    if (product.originalPrice !== undefined && product.originalPrice !== null) {
        if (product.originalPrice < 0) {
            errors.push('Original price must be positive');
        }
        if (product.price && product.originalPrice < product.price) {
            errors.push('Original price must be greater than or equal to current price');
        }
    }

    // Category validation
    if (!product.category || product.category.trim().length === 0) {
        errors.push('Category is required');
    }

    // Rating validation
    if (product.rating !== undefined && product.rating !== null) {
        if (product.rating < 0 || product.rating > 5) {
            errors.push('Rating must be between 0 and 5');
        }
    }

    // Reviews count validation
    if (product.reviews !== undefined && product.reviews !== null) {
        if (product.reviews < 0) {
            errors.push('Review count cannot be negative');
        }
    }

    // Affiliate link validation
    if (product.affiliateLink && !isValidUrl(product.affiliateLink)) {
        errors.push('Affiliate link must be a valid URL');
    }

    // Description sanitization (mutates the object)
    if (product.description) {
        const sanitized = sanitizeHtml(product.description);
        if (sanitized !== product.description) {
            errors.push('Description contains potentially unsafe HTML (it has been sanitized)');
            product.description = sanitized;
        }
    }

    // Image URL validation
    if (product.image && !isValidUrl(product.image) && !product.image.startsWith('data:')) {
        errors.push('Image must be a valid URL or base64 data URI');
    }

    return errors;
};

/**
 * Validates a BlogPost object
 * 
 * @param post - Partial blog post data to validate
 * @returns Array of error messages (empty if valid)
 */
export const validateBlogPost = (post: Partial<BlogPost>): string[] => {
    const errors: string[] = [];

    // Title validation
    if (!post.title || post.title.trim().length < 5) {
        errors.push('Title must be at least 5 characters long');
    }
    if (post.title && post.title.length > 200) {
        errors.push('Title must be less than 200 characters');
    }

    // Excerpt validation
    if (!post.excerpt || post.excerpt.trim().length < 10) {
        errors.push('Excerpt must be at least 10 characters long');
    }
    if (post.excerpt && post.excerpt.length > 500) {
        errors.push('Excerpt must be less than 500 characters');
    }

    // Content validation
    if (!post.content || post.content.trim().length < 50) {
        errors.push('Content must be at least 50 characters long');
    }

    // Content sanitization (for HTML content)
    if (post.content) {
        const sanitized = sanitizeHtml(post.content);
        if (sanitized !== post.content) {
            errors.push('Content contains potentially unsafe HTML (it has been sanitized)');
            post.content = sanitized;
        }
    }

    // Author validation
    if (!post.author || post.author.trim().length === 0) {
        errors.push('Author name is required');
    }

    // Image URL validation
    if (post.image && !isValidUrl(post.image) && !post.image.startsWith('data:')) {
        errors.push('Image must be a valid URL or base64 data URI');
    }

    // Linked products validation
    if (post.linkedProductIds && !Array.isArray(post.linkedProductIds)) {
        errors.push('Linked product IDs must be an array');
    }

    return errors;
};

/**
 * Validates user input for authentication
 */
export const validateAuth = (email: string, password: string, name?: string): string[] => {
    const errors: string[] = [];

    // Email validation
    if (!email || !isValidEmail(email)) {
        errors.push('Please enter a valid email address');
    }

    // Password validation
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    if (password && password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }

    // Name validation (if provided)
    if (name !== undefined) {
        if (!name || name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }
        if (name && name.length > 100) {
            errors.push('Name must be less than 100 characters');
        }
    }

    return errors;
};

/**
 * Type guard to check if a value is a valid product status
 */
export const isValidProductStatus = (status: any): status is 'draft' | 'pending' | 'published' => {
    return ['draft', 'pending', 'published'].includes(status);
};

/**
 * Type guard to check if a value is a valid user role
 */
export const isValidUserRole = (role: any): role is 'user' | 'editor' | 'admin' => {
    return ['user', 'editor', 'admin'].includes(role);
};

/**
 * Validates and sanitizes a text input
 */
export const sanitizeTextInput = (input: string, maxLength: number = 1000): string => {
    if (!input || typeof input !== 'string') return '';

    // Remove any null bytes and trim
    const sanitized = input
        .replace(/\0/g, '')
        .trim()
        .slice(0, maxLength);

    return sanitized;
};
