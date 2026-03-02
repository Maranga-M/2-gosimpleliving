import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

/**
 * Component to handle injection of affiliate-related scripts and meta tags.
 * This includes Pinterest verification, Google/Bing verification, and custom tracking codes.
 */
export const AffiliateScripts: React.FC = () => {
    const { content } = useApp();
    const { siteContent } = content;
    const config = siteContent.affiliateConfig;

    useEffect(() => {
        if (!config || config.globalEnabled === false) return;

        // --- 1. Meta Tags (Pinterest, Google, Bing) ---
        const metaTags: Record<string, string | undefined> = {
            'p:domain_verify': config.pinterestEnabled ? config.pinterestVerificationCode : undefined,
            'google-site-verification': config.googleSiteVerification,
            'msvalidate.01': config.bingSiteVerification,
            'facebook-domain-verification': config.facebookDomainVerification
        };

        Object.entries(metaTags).forEach(([name, content]) => {
            if (!content) {
                // Remove if exists and should be disabled
                const existing = document.querySelector(`meta[name="${name}"]`);
                if (existing) existing.remove();
                return;
            }

            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        });

        // --- 2. Tracking Codes ---
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
