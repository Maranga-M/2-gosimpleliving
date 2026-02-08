import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Star, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Button } from '../../components/Button';
import { AnalyticsService } from '../../services/analytics';

export const ClickBankLandingPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { content } = useApp();
    const { siteContent } = content;

    const offer = siteContent.clickBankOffers?.find(o => o.slug === slug);

    useEffect(() => {
        if (offer) {
            document.title = `${offer.title} | ${siteContent.logoText}`;
            // Track view
            AnalyticsService.trackPageView(`/offers/${slug}`);
        }
    }, [offer, slug, siteContent.logoText]);

    if (!offer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Offer Not Found</h1>
                <p className="mb-6 text-slate-600">The offer you are looking for does not exist or has been removed.</p>
                <Button onClick={() => navigate('/')} themeColor={siteContent.themeColor}>Return Home</Button>
            </div>
        );
    }

    const handleCtaClick = () => {
        AnalyticsService.trackEvent({
            event_type: 'click',
            source: 'landing_page_cta',
            medium: 'referral',
            campaign: offer.slug,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });

        // Allow analytics to fire before redirecting (small delay or use beacon if possible, 
        // but straight assign is robust enough for simple affiliate links)
        window.location.href = offer.affiliateLink;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
            {/* Disclaimer Bar */}
            <div className="bg-slate-100 dark:bg-slate-900 py-2 px-4 text-center text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                Advertorial: This is a paid advertisement and not a news article, blog, or consumer protection update.
            </div>

            {/* Hero Section */}
            <header className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider animate-pulse">
                        Attention: Limited Time Offer
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                        {offer.headline}
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                        {offer.subheadline}
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={handleCtaClick}
                            className={`
                px-8 py-5 rounded-full text-xl font-bold text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all
                items-center gap-3 flex
                ${siteContent.themeColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                                    siteContent.themeColor === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
                                        siteContent.themeColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                            siteContent.themeColor === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' :
                                                'bg-amber-600 hover:bg-amber-700'}
              `}
                        >
                            {offer.ctaButtonText} <ArrowRight size={24} />
                        </button>
                        {offer.ctaSecondaryText && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-green-500" /> {offer.ctaSecondaryText}
                            </p>
                        )}
                    </div>

                    {offer.heroImageUrl && (
                        <div className="mt-16 relative mx-auto max-w-4xl shadow-2xl rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800">
                            <img src={offer.heroImageUrl} alt={offer.title} className="w-full h-auto" />
                        </div>
                    )}
                </div>
            </header>

            {/* Problem Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-start gap-6">
                            <div className="shrink-0 p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600 dark:text-red-400 hidden sm:block">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-6">Does This Sound Like You?</h2>
                                <div className="prose prose-lg dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                                    <p className="whitespace-pre-line leading-relaxed text-lg">
                                        {offer.problemStatement}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            {offer.productImageUrl ? (
                                <img src={offer.productImageUrl} alt="Product Solution" className="rounded-2xl shadow-xl w-full rotate-3 hover:rotate-0 transition-transform duration-500" />
                            ) : (
                                <div className="aspect-square rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
                                    <span className="text-6xl">✨</span>
                                </div>
                            )}
                        </div>
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-bold mb-6">Introducing: <span className="text-amber-600 dark:text-amber-400">{offer.title}</span></h2>
                            <div className="prose prose-lg dark:prose-invert mb-8 text-slate-600 dark:text-slate-300">
                                <p className="whitespace-pre-line">{offer.solutionText}</p>
                            </div>

                            <ul className="space-y-4 mb-10">
                                {offer.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-4">
                                        <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mt-1">
                                            <Check size={20} strokeWidth={3} />
                                        </div>
                                        <span className="text-lg font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            {offer.testimonials && offer.testimonials.length > 0 && (
                <section className="py-24 bg-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Real Results From Real People</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {offer.testimonials.map((testi) => (
                                <div key={testi.id} className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                                    <div className="flex items-center gap-1 mb-4 text-amber-400">
                                        {[...Array(testi.rating || 5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                                    </div>
                                    <p className="text-lg text-slate-300 italic mb-6">"{testi.quote}"</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center font-bold text-xl">
                                            {testi.avatar ? <img src={testi.avatar} alt={testi.name} className="w-full h-full rounded-full object-cover" /> : testi.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold">{testi.name}</h4>
                                            <span className="text-sm text-slate-500">Verified Buyer</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Guarantee & Final CTA */}
            <section className="py-24 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-12 inline-block p-6 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700">
                        <ShieldCheck size={64} className="text-green-500 mx-auto" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-4xl font-bold mb-6">
                        {offer.guaranteeText || "100% Money-Back Guarantee"}
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
                        Try {offer.title} today strictly risk-free. If you don't love it, you get your money back. No questions asked.
                    </p>

                    <button
                        onClick={handleCtaClick}
                        className={`
                w-full md:w-auto px-12 py-6 rounded-2xl text-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all
                animate-bounce-subtle
                ${siteContent.themeColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                                siteContent.themeColor === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
                                    siteContent.themeColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        siteContent.themeColor === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' :
                                            'bg-amber-600 hover:bg-amber-700'}
              `}
                    >
                        {offer.ctaButtonText}
                    </button>
                    <p className="mt-6 text-sm text-slate-500">
                        Secure Checkout • Instant Access • 24/7 Support
                    </p>
                </div>
            </section>

            <footer className="bg-white dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
                <div className="max-w-7xl mx-auto px-4">
                    {siteContent.footerText}
                    <div className="mt-4 flex justify-center gap-6">
                        <span className="cursor-pointer hover:underline" onClick={() => navigate('/privacy-policy')}>Privacy Policy</span>
                        <span className="cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
                    </div>
                    <p className="mt-8 text-xs opacity-50">
                        This site is not a part of the Facebook website or Facebook Inc. Additionally, This site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
                    </p>
                </div>
            </footer>
        </div>
    );
};
