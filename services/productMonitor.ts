import { Product } from '../types';

export interface ValidationIssue {
    severity: 'critical' | 'warning' | 'info';
    code: 'DESTINATION_MISMATCH' | 'MERCHANT_MISMATCH' | 'MISSING_TAG' | 'INVALID_PRICE' | 'IRRELEVANT_PRODUCT';
    message: string;
    details?: string;
}

export interface ProductValidationResult {
    productId: string;
    productTitle: string;
    isValid: boolean;
    isBlocked: boolean;
    issues: ValidationIssue[];
    verifiedAt: string;
}

export interface ProductValidationSummary {
    totalChecked: number;
    validCount: number;
    blockedCount: number;
    criticalIssuesCount: number;
    warningCount: number;
    results: ProductValidationResult[];
}

export interface ValidationAlert {
    id: string;
    productId: string;
    productTitle: string;
    severity: 'critical' | 'warning';
    message: string;
    timestamp: string;
}

/**
 * Product & Merchant Monitor
 * Deterministic validation module to check URLs, destination title match,
 * merchant alignment, price/availability, and affiliate parameters.
 */
export class ProductMonitorService {
    /**
     * Validates a single product against strict merchant & simple living criteria.
     */
    static validateProduct(product: Product): ProductValidationResult {
        const issues: ValidationIssue[] = [];
        const titleLower = product.title.toLowerCase();
        const linkLower = product.affiliateLink.toLowerCase();
        const descLower = (product.description || '').toLowerCase();

        // 1. Critical Check: Software key or mismatched destination
        const isSoftwareKey = titleLower.includes('windows') || titleLower.includes('office') || titleLower.includes('oem key') || titleLower.includes('cdkey');
        const linkHasMismatchedSoftware = linkLower.includes('cdkeys') || linkLower.includes('software');

        if (isSoftwareKey || linkHasMismatchedSoftware) {
            issues.push({
                severity: 'critical',
                code: 'IRRELEVANT_PRODUCT',
                message: 'Product violates simple-living brand positioning (Software Key / Unrelated Digital Product detected).',
                details: `Title: "${product.title}" or Link: "${product.affiliateLink}" contains software key catalog terms.`
            });
        }

        // 2. Critical Check: Destination Mismatch (e.g. Windows key pointing to Office or mismatched merchant)
        if (titleLower.includes('windows') && linkLower.includes('office')) {
            issues.push({
                severity: 'critical',
                code: 'DESTINATION_MISMATCH',
                message: 'Destination mismatch: Product title references Windows but destination URL references Microsoft Office.',
                details: `URL ${product.affiliateLink} does not match product title "${product.title}".`
            });
        }

        // 3. Merchant Alignment Check
        if (product.affiliateLinkLabel) {
            const labelLower = product.affiliateLinkLabel.toLowerCase();
            if (labelLower.includes('amazon') && !linkLower.includes('amazon') && !linkLower.includes('amzn.to')) {
                issues.push({
                    severity: 'critical',
                    code: 'MERCHANT_MISMATCH',
                    message: 'Merchant disclosure mismatch: Button label states Amazon but link points to another merchant.',
                    details: `Label: "${product.affiliateLinkLabel}" vs Link: "${product.affiliateLink}".`
                });
            } else if (labelLower.includes('eartheasy') && !linkLower.includes('eartheasy')) {
                issues.push({
                    severity: 'critical',
                    code: 'MERCHANT_MISMATCH',
                    message: 'Merchant disclosure mismatch: Button label states Eartheasy but link points elsewhere.',
                    details: `Label: "${product.affiliateLinkLabel}" vs Link: "${product.affiliateLink}".`
                });
            }
        }

        // 4. Price & Availability Check
        if (product.price <= 0 || isNaN(product.price)) {
            issues.push({
                severity: 'critical',
                code: 'INVALID_PRICE',
                message: 'Invalid price: Product price must be greater than 0.',
                details: `Price recorded as ${product.price}.`
            });
        }

        // 5. Affiliate Parameter Check
        if (linkLower.includes('amazon.com') && !linkLower.includes('tag=')) {
            issues.push({
                severity: 'warning',
                code: 'MISSING_TAG',
                message: 'Missing Amazon Associate tag on raw link URL. Ensure runtime tag injection is active.',
                details: `Raw affiliate link missing tag parameter: ${product.affiliateLink}`
            });
        }

        const isBlocked = issues.some(i => i.severity === 'critical');
        const isValid = !isBlocked;

        return {
            productId: product.id,
            productTitle: product.title,
            isValid,
            isBlocked,
            issues,
            verifiedAt: new Date().toISOString()
        };
    }

    /**
     * Validates entire product catalog.
     */
    static validateCatalog(products: Product[]): ProductValidationSummary {
        const results = products.map(p => this.validateProduct(p));
        const validCount = results.filter(r => r.isValid).length;
        const blockedCount = results.filter(r => r.isBlocked).length;
        const criticalIssuesCount = results.reduce((acc, r) => acc + r.issues.filter(i => i.severity === 'critical').length, 0);
        const warningCount = results.reduce((acc, r) => acc + r.issues.filter(i => i.severity === 'warning').length, 0);

        return {
            totalChecked: products.length,
            validCount,
            blockedCount,
            criticalIssuesCount,
            warningCount,
            results
        };
    }

    /**
     * Filters catalog to only return valid, unblocked products for public rendering.
     */
    static filterValidProducts(products: Product[]): Product[] {
        return products.filter(product => {
            const validation = this.validateProduct(product);
            return !validation.isBlocked && product.status === 'published';
        });
    }

    /**
     * Extracts actionable alerts for admin monitoring.
     */
    static getValidationAlerts(products: Product[]): ValidationAlert[] {
        const alerts: ValidationAlert[] = [];
        products.forEach(product => {
            const result = this.validateProduct(product);
            result.issues.forEach((issue, idx) => {
                if (issue.severity === 'critical' || issue.severity === 'warning') {
                    alerts.push({
                        id: `${product.id}-alert-${idx}`,
                        productId: product.id,
                        productTitle: product.title,
                        severity: issue.severity,
                        message: `${issue.message} ${issue.details ? `(${issue.details})` : ''}`,
                        timestamp: result.verifiedAt
                    });
                }
            });
        });
        return alerts;
    }
}
