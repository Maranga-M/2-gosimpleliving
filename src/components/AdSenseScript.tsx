import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export const AdSenseScript: React.FC = () => {
    const { content } = useApp();
    const { siteContent } = content;
    const { adSenseEnabled, adSenseClientId } = siteContent;

    useEffect(() => {
        // If disabled or no client ID, do nothing (or potentially remove script if we supported disabling)
        if (!adSenseEnabled || !adSenseClientId) return;

        // Check if script is already present
        const existingScript = document.querySelector(`script[src*="adsbygoogle.js"]`);
        if (existingScript) return;

        // Inject the script
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);

        return () => {
            // Optional: Remove script on unmount if needed, but usually redundant for global ads
        };
    }, [adSenseEnabled, adSenseClientId]);

    return null; // This component renders nothing
};
