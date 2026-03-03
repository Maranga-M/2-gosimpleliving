import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const OffersListPage: React.FC = () => {
    const { content } = useApp();
    const { siteContent } = content;

    const offers = (siteContent.clickBankOffers || []).filter(o => o.status === 'published');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Exclusive Offers</h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Hand-picked products and special deals recommended just for you.
                </p>
            </div>

            {offers.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 text-lg">No special offers available at the moment. Please check back soon!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {offers.map((offer) => (
                        <Link
                            key={offer.id}
                            to={`/offers/${offer.slug}`}
                            className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="h-56 overflow-hidden relative">
                                {offer.heroImageUrl ? (
                                    <img src={offer.heroImageUrl} alt={offer.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <span className="text-4xl opacity-20">🎁</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                                    <Star size={12} className="text-amber-500 fill-amber-500" /> Featured
                                </div>
                            </div>

                            <div className="p-8 flex-grow flex flex-col">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                                    {offer.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed flex-grow">
                                    {offer.subheadline}
                                </p>

                                <div className="mt-auto">
                                    <span className={`
                    inline-flex items-center gap-2 font-bold text-sm
                    ${siteContent.themeColor === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                            siteContent.themeColor === 'rose' ? 'text-rose-600 dark:text-rose-400' :
                                                siteContent.themeColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                                                    'text-amber-600 dark:text-amber-400'}
                  `}>
                                        View Offer <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};
