import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

interface GoogleAdProps {
    slot?: string; // Optional: Allow overriding slot ID for specific placements
    format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'; // Ad format
    style?: React.CSSProperties; // Custom styles
    className?: string; // Custom classes
}

export const GoogleAd: React.FC<GoogleAdProps> = ({ slot, format = 'auto', style = {}, className = '' }) => {
    const { content } = useApp();
    const { siteContent } = content;
    const { adSenseEnabled, adSenseClientId } = siteContent;

    useEffect(() => {
        if (!adSenseEnabled || !adSenseClientId) return;

        try {
            // Push to adsbygoogle array
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense Error:", e);
        }
    }, [adSenseEnabled, adSenseClientId]);

    if (!adSenseEnabled) return null;

    // In development mode, check if we want to show a placeholder
    const isDev = process.env.NODE_ENV === 'development';

    // If running locally (often blocked), show a placeholder for debugging layout
    if (isDev && (!adSenseClientId || adSenseClientId === 'your-client-id')) {
        return (
            <div className={`p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-center ${className}`} style={style}>
                <p className="font-bold text-sm">AdSpace (Dev Mode)</p>
                <p className="text-xs">Configure Client ID in Admin Dashboard</p>
            </div>
        );
    }

    return (
        <ins className="adsbygoogle"
            style={{ display: 'block', ...style }}
            data-ad-client={adSenseClientId}
            data-ad-slot={slot || "auto"} // Use auto if no specific slot provided, often works for general placements
            data-ad-format={format}
            data-full-width-responsive="true"></ins>
    );
};
