
import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../src/contexts/AppContext';

import { Facebook, Twitter, Instagram, Linkedin, Github, Youtube, MessageCircle, Music2, Pin } from 'lucide-react';

const SocialIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
        case 'facebook': return <Facebook size={20} />;
        case 'twitter': return <Twitter size={20} />;
        case 'instagram': return <Instagram size={20} />;
        case 'linkedin': return <Linkedin size={20} />;
        case 'github': return <Github size={20} />;
        case 'youtube': return <Youtube size={20} />;
        case 'tiktok': return <Music2 size={20} />;
        case 'pinterest': return <Pin size={20} />;
        default: return <MessageCircle size={20} />;
    }
};

const TrustedPartners: React.FC = () => {
    const { content } = useApp();
    const { siteContent } = content;

    const partners = [];

    // Check Amazon
    if (siteContent.amazonAssociatesId || (siteContent.uiText && siteContent.uiText.shopNav)) {
        partners.push({ name: 'Amazon Associates', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' });
    }

    // Check ClickBank
    if (siteContent.clickBankOffers && siteContent.clickBankOffers.length > 0) {
        partners.push({ name: 'ClickBank', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/ClickBank_logo.svg' }); // Using a placeholder/public logo
    }

    // Check CJ (respect global toggle)
    if (
        siteContent.affiliateConfig?.globalEnabled !== false &&
        siteContent.affiliateConfig?.cjEnabled
    ) {
        partners.push({ name: 'CJ Affiliate', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/CJ_Affiliate_Logo.svg' }); // Placeholder
    }

    if (partners.length === 0) return null;

    return (
        <div className="py-8 border-b border-slate-200 dark:border-slate-800">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Trusted Partners</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                {partners.map((p, idx) => (
                    <div key={idx} className="h-8 flex items-center justify-center" title={p.name}>
                        {/* Using text fallback for now if logos break, but typically we'd use SVGs */}
                        <span className="text-slate-500 font-bold text-lg">{p.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const Footer: React.FC = () => {
    const { content } = useApp();
    const { siteContent } = content;

    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-20">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

                <TrustedPartners />

                <div className="flex flex-col items-center gap-6 mt-8">
                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center">
                        {siteContent.footerText || `© ${new Date().getFullYear()} ${siteContent.logoText}. All rights reserved.`}
                    </div>

                    {/* Social Links */}
                    {siteContent.socialLinks && siteContent.socialLinks.length > 0 && (
                        <div className="flex gap-4">
                            {siteContent.socialLinks.filter(l => l.url && l.url.trim() !== '').map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                                    title={link.platform}
                                >
                                    <SocialIcon platform={link.platform} />
                                </a>
                            ))}
                        </div>
                    )}

                    {siteContent.footerLinks && siteContent.footerLinks.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6">
                            {siteContent.footerLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-4">
                        <Link to="/privacy-policy" className="text-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4">
                            Privacy Policy
                        </Link>
                        <Link to="/sitemap" className="text-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4">
                            Sitemap
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
