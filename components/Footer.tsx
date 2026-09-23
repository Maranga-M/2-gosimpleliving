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
    const { content, products } = useApp();
    const { siteContent } = content;

    const partnersSet = new Set<string>();

    // Scan active catalog products for merchant partners
    (products.products || []).forEach(p => {
        const link = (p.affiliateLink || '').toLowerCase();
        if (link.includes('eartheasy.com')) partnersSet.add('Eartheasy');
        if (link.includes('amazon.com') || link.includes('amzn.to') || siteContent.amazonAssociatesId) partnersSet.add('Amazon Associates');
        if (link.includes('containerstore.com')) partnersSet.add('The Container Store');
        if (link.includes('homedepot.com')) partnersSet.add('The Home Depot');
    });

    if (partnersSet.size === 0) {
        partnersSet.add('Eartheasy');
        partnersSet.add('Amazon Associates');
    }

    const partners = Array.from(partnersSet);

    return (
        <div className="py-8 border-b border-slate-200 dark:border-slate-800">
            <p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Recommended Merchant Partners</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-70 hover:opacity-100 transition-all duration-300">
                {partners.map((partnerName, idx) => (
                    <div key={idx} className="h-8 flex items-center justify-center px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg" title={partnerName}>
                        <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">{partnerName}</span>
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
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-16 sm:mt-20">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">

                <TrustedPartners />

                <div className="py-4 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed max-w-3xl mx-auto">
                        <strong>Affiliate Disclosure:</strong> GoSimpleLiving is an independent publication supported by our readers. When you purchase products through links on our site, we may earn an affiliate commission at no extra cost to you. We recommend durable, high-quality products selected for simple living and sustainable homes.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-6 mt-8">
                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center">
                        {siteContent.footerText || `© ${new Date().getFullYear()} ${siteContent.logoText}. All rights reserved.`}
                    </div>

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
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                            {siteContent.footerLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                        <Link to="/privacy-policy" className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2 sm:underline-offset-4">
                            Privacy Policy
                        </Link>
                        <Link to="/sitemap" className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2 sm:underline-offset-4">
                            Sitemap
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
