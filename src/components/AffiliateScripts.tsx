import React, { useLayoutEffect } from 'react';
import { useApp } from '../contexts/AppContext';

/**
 * Component to handle injection of affiliate-related scripts and meta tags.
 * This includes Pinterest verification, Google/Bing verification, and custom tracking codes.
 */
export const AffiliateScripts: React.FC = () => {
    const { content } = useApp();
    const { siteContent } = content;
    const config = siteContent.affiliateConfig;

    useLayoutEffect(() => {
        if (!config || config.globalEnabled === false) return;

        // --- 1. Meta Tags (Pinterest, Google, Bing) ---
        const metaTags: Record<string, string | undefined> = {
            'p:domain_verify': config.pinterestEnabled ? config.pinterestVerificationCode : undefined,
            'google-site-verification': config.googleSiteVerification,
            'msvalidate.01': config.bingSiteVerification,
            'facebook-domain-verification': config.facebookDomainVerification
        };

        // Helper: extract just the content value if user pasted a full <meta> tag
        const extractContentValue = (raw: string): string => {
            const match = raw.match(/content=["']([^"']+)["']/);
            return match ? match[1] : raw.trim();
        };

        Object.entries(metaTags).forEach(([name, content]) => {
            if (!content) {
                // Remove if exists and should be disabled
                const existing = document.querySelector(`meta[name="${name}"]`);
                if (existing) existing.remove();
                return;
            }

            const cleanContent = extractContentValue(content);

            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', cleanContent);
        });

        // --- 2. Site Crawler Detection & Tracking Codes ---
        const defaultCrawlers = ['googlebot','bingbot','slurp','duckduckgo','baiduspider','yandex','facebookexternalhit','pinterest','twitterbot','linkedinbot','petalbot','applebot','semrushbot'];
        let isCrawlerDetected = false;
        if (config.enableSiteCrawlerDetection) {
            try {
                const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.toLowerCase() : '';
                const crawlerList = (config.crawlerUserAgents && config.crawlerUserAgents.length > 0)
                    ? config.crawlerUserAgents.map(s => s.toLowerCase())
                    : defaultCrawlers;
                isCrawlerDetected = crawlerList.some(sub => ua.includes(sub));
                if (isCrawlerDetected) {
                    // mark the document for downstream logic
                    document.documentElement.setAttribute('data-crawler', 'true');
                    let meta = document.querySelector('meta[name="x-is-crawler"]');
                    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'x-is-crawler'); document.head.appendChild(meta); }
                    meta.setAttribute('content', 'true');
                    if (config.logCrawlerTraffic) console.info('Crawler detected via UA:', ua);
                }
            } catch (err) {
                // swallow errors
                console.warn('Crawler detection failed', err);
            }
        }

        // If crawler detected, skip injecting tracking codes to avoid polluting analytics and respecting crawler privacy
        if (isCrawlerDetected) {
            // do not inject tracking codes
        } else {
            if (config.trackingCodes && config.trackingCodes.length > 0) {
                config.trackingCodes.forEach(tc => {
                    if (!tc.enabled || !tc.code) return;

                    const scriptId = `gsl-tracking-${tc.id}`;
                    if (document.getElementById(scriptId)) return;

                    const wrapper = document.createElement('div');
                    wrapper.id = scriptId;
                    wrapper.innerHTML = tc.code;

                    // Track scripts inside the code blocks and execute them
                    const scripts = wrapper.querySelectorAll('script');
                    scripts.forEach(oldScript => {
                        const newScript = document.createElement('script');
                        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                        oldScript.parentNode?.replaceChild(newScript, oldScript);
                    });

                    if (tc.placement === 'head') {
                        document.head.appendChild(wrapper);
                    } else {
                        document.body.appendChild(wrapper);
                    }
                });
            }
        }

        return () => {
            // Clean up meta tags if config changes
            Object.keys(metaTags).forEach(name => {
                const meta = document.querySelector(`meta[name="${name}"]`);
                if (meta) meta.remove();
            });

            // Clean up tracking codes
            if (config.trackingCodes) {
                config.trackingCodes.forEach(tc => {
                    const scriptId = `gsl-tracking-${tc.id}`;
                    document.getElementById(scriptId)?.remove();
                });
            }
        };
    }, [config]);

    return null;
};
