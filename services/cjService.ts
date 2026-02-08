import { CJLink, AffiliateConfig } from '../types';
import toast from 'react-hot-toast';

/**
 * CJ Affiliate Service
 * Handles Commission Junction deep linking and tracking
 */

export class CJService {
    /**
     * Generate a CJ affiliate link from a product URL
     * @param productUrl - The original product URL
     * @param config - Affiliate configuration with PID and optional Sub ID
     * @returns CJLink object with affiliate URL
     */
    static generateCJLink(productUrl: string, config: AffiliateConfig): CJLink {
        if (!config.cjEnabled || !config.cjPublisherId) {
            return {
                originalUrl: productUrl,
                affiliateUrl: productUrl,
                publisherId: '',
                timestamp: Date.now()
            };
        }

        try {
            // CJ deep link format: https://www.anrdoezrs.net/links/PID/type/dlg/SID/URL
            // Or: https://www.kqzyfj.com/click-PID-SID?url=URL
            const pid = config.cjPublisherId;
            const sid = config.cjSubId || 'default';

            // Encode the destination URL
            const encodedUrl = encodeURIComponent(productUrl);

            // Generate CJ affiliate link using the click tracker format
            const affiliateUrl = `https://www.anrdoezrs.net/links/${pid}/type/dlg/${sid}/${encodedUrl}`;

            return {
                originalUrl: productUrl,
                affiliateUrl,
                publisherId: pid,
                subId: sid,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error generating CJ link:', error);
            return {
                originalUrl: productUrl,
                affiliateUrl: productUrl,
                publisherId: config.cjPublisherId,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Track a CJ affiliate click
     * @param link - The CJ link that was clicked
     */
    static trackCJClick(link: CJLink): void {
        try {
            // Log the click for analytics
            console.log('[CJ Tracking] Click tracked:', {
                publisherId: link.publisherId,
                subId: link.subId,
                timestamp: new Date(link.timestamp).toISOString()
            });

            // Store in localStorage for tracking
            const clicks = this.getCJClicks();
            clicks.push({
                ...link,
                clickedAt: Date.now()
            });

            // Keep only last 100 clicks
            if (clicks.length > 100) {
                clicks.shift();
            }

            localStorage.setItem('cj_clicks', JSON.stringify(clicks));
        } catch (error) {
            console.error('Error tracking CJ click:', error);
        }
    }

    /**
     * Get all tracked CJ clicks from localStorage
     */
    static getCJClicks(): any[] {
        try {
            const stored = localStorage.getItem('cj_clicks');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Validate CJ configuration
     * @param config - Affiliate configuration to validate
     * @returns Validation result with error message if invalid
     */
    static validateCJConfig(config: AffiliateConfig): { valid: boolean; error?: string } {
        if (!config.cjEnabled) {
            return { valid: true }; // Not enabled, so no validation needed
        }

        if (!config.cjPublisherId) {
            return {
                valid: false,
                error: 'Publisher ID (PID) is required when CJ Affiliate is enabled'
            };
        }

        // PID should be numeric
        if (!/^\d+$/.test(config.cjPublisherId)) {
            return {
                valid: false,
                error: 'Publisher ID must be a numeric value'
            };
        }

        return { valid: true };
    }

    /**
     * Test a CJ link by generating it and showing a preview
     * @param testUrl - URL to test
     * @param config - Affiliate configuration
     */
    static testCJLink(testUrl: string, config: AffiliateConfig): void {
        const validation = this.validateCJConfig(config);

        if (!validation.valid) {
            toast.error(validation.error || 'Invalid CJ configuration');
            return;
        }

        const link = this.generateCJLink(testUrl, config);

        if (link.affiliateUrl === testUrl) {
            toast.error('CJ link generation failed - check your configuration');
            return;
        }

        // Show success with link preview
        toast.success(
            `CJ Link Generated!\nPID: ${link.publisherId}\nSub ID: ${link.subId || 'default'}`,
            { duration: 5000 }
        );

        // Copy to clipboard
        navigator.clipboard.writeText(link.affiliateUrl).then(() => {
            toast.success('Affiliate link copied to clipboard!');
        });

        console.log('[CJ Test] Generated link:', link);
    }

    /**
     * Get CJ click statistics
     */
    static getCJStats(): { totalClicks: number; last24Hours: number; bySubId: Record<string, number> } {
        const clicks = this.getCJClicks();
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        const stats = {
            totalClicks: clicks.length,
            last24Hours: clicks.filter((c: any) => c.clickedAt > oneDayAgo).length,
            bySubId: {} as Record<string, number>
        };

        // Count by sub ID
        clicks.forEach((click: any) => {
            const subId = click.subId || 'default';
            stats.bySubId[subId] = (stats.bySubId[subId] || 0) + 1;
        });

        return stats;
    }
}

export default CJService;
