import { AffiliateNetwork, AffiliateConfig, Product } from '../types';

/**
 * Generic Affiliate Service for handling multiple affiliate networks
 */
export class AffiliateService {
    /**
     * Generate affiliate link based on network configuration
     */
    static generateAffiliateLink(
        originalUrl: string,
        network: AffiliateNetwork,
        product?: Product
    ): string {
        if (!network.enabled || !network.linkTemplate) {
            return originalUrl;
        }

        try {
            // Replace template variables
            let affiliateUrl = network.linkTemplate;

            // Replace common placeholders
            affiliateUrl = affiliateUrl.replace(/{productUrl}/g, encodeURIComponent(originalUrl));
            affiliateUrl = affiliateUrl.replace(/{publisherId}/g, network.publisherId || '');
            affiliateUrl = affiliateUrl.replace(/{websiteId}/g, network.websiteId || '');
            affiliateUrl = affiliateUrl.replace(/{subId}/g, network.subId || '');

            // Product-specific placeholders
            if (product) {
                affiliateUrl = affiliateUrl.replace(/{productId}/g, product.id || '');
                affiliateUrl = affiliateUrl.replace(/{productTitle}/g, encodeURIComponent(product.title || ''));
                affiliateUrl = affiliateUrl.replace(/{productPrice}/g, String(product.price || ''));
            }

            // Add custom params if any
            if (network.customParams && Object.keys(network.customParams).length > 0) {
                const params = new URLSearchParams(network.customParams);
                const separator = affiliateUrl.includes('?') ? '&' : '?';
                affiliateUrl += separator + params.toString();
            }

            return affiliateUrl;
        } catch (error) {
            console.error('Error generating affiliate link:', error);
            return originalUrl;
        }
    }

    /**
     * Get the active affiliate network for a product
     * Priority: First enabled network in the list
     */
    static getActiveNetwork(
        config?: AffiliateConfig
    ): AffiliateNetwork | null {
        if (!config || config.globalEnabled === false) {
            return null;
        }

        const networks = config.affiliateNetworks || [];
        return networks.find(n => n.enabled) || null;
    }

    /**
     * Get all enabled networks
     */
    static getEnabledNetworks(config?: AffiliateConfig): AffiliateNetwork[] {
        if (!config || config.globalEnabled === false) {
            return [];
        }

        return (config.affiliateNetworks || []).filter(n => n.enabled);
    }

    /**
     * Validate network configuration
     */
    static validateNetwork(network: AffiliateNetwork): { valid: boolean; error?: string } {
        if (!network.name || network.name.trim() === '') {
            return { valid: false, error: 'Network name is required' };
        }

        if (network.enabled && !network.linkTemplate) {
            return { valid: false, error: 'Link template is required for enabled networks' };
        }

        // Validate template has required placeholders
        if (network.linkTemplate && !network.linkTemplate.includes('{productUrl}')) {
            return { valid: false, error: 'Link template must include {productUrl} placeholder' };
        }

        return { valid: true };
    }

    /**
     * Track affiliate click (for analytics)
     */
    static trackAffiliateClick(network: AffiliateNetwork, product?: Product): void {
        try {
            // Log to console for debugging
            console.log('[Affiliate Click]', {
                network: network.name,
                networkId: network.id,
                product: product?.title,
                timestamp: new Date().toISOString()
            });

            // Could integrate with analytics service here
            // e.g., Google Analytics, Mixpanel, etc.
        } catch (error) {
            console.error('Error tracking affiliate click:', error);
        }
    }
}
