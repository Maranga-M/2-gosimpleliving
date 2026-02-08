import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Button } from '../../components/Button';
import { ArrowLeft, ExternalLink, Package } from 'lucide-react';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { Footer } from '../../components/Footer';


export const CustomPageRenderer: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { content, products: productsHook } = useApp();
    const { liveSiteContent } = content;
    const { products } = productsHook;

    const page = liveSiteContent.customPages?.find(p => p.slug === slug);

    if (!page || page.status === 'draft') {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Page Not Found</h1>
                <p className="text-slate-500 mb-8 max-w-md text-center">The page you are looking for doesn't exist or is currently a draft.</p>
                <Link to="/">
                    <Button variant="primary">Return Home</Button>
                </Link>
            </div>
        );
    }

    const linkedProducts = products.filter(p => page.linkedProductIds?.includes(p.id));

    const hasHeroImage = page.heroImageUrl && page.heroImageUrl.trim().length > 0;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Hero Image (if exists and valid) */}
            {hasHeroImage && (
                <div className="relative h-[400px] md:h-[500px] bg-slate-900 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${page.heroImageUrl})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80"></div>
                    </div>

                    {/* Hero Content */}
                    <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-16">
                        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors group mb-6">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Back to Shopping</span>
                        </Link>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {page.title}
                        </h1>
                        <div className="h-1.5 w-24 bg-amber-500 rounded-full animate-in fade-in slide-in-from-left duration-700 delay-200"></div>
                    </div>
                </div>
            )}

            {/* Minimal Header / Back Button (when no hero) */}
            {!hasHeroImage && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Shopping</span>
                    </Link>
                </div>
            )}

            <article className={`max-w-4xl mx-auto px-4 pb-24 ${hasHeroImage ? 'pt-12' : 'pt-0'}`}>
                {!hasHeroImage && (
                    <header className="mb-12">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                            {page.title}
                        </h1>
                        <div className="h-1.5 w-24 bg-amber-500 rounded-full"></div>
                    </header>
                )}

                <div className="mb-16">
                    <MarkdownRenderer content={page.content} tables={page.comparisonTables} />
                </div>

                {linkedProducts.length > 0 && (
                    <section className="mt-20 border-t border-slate-100 dark:border-slate-800 pt-16">
                        <div className="flex items-center gap-3 mb-8">
                            <Package className="text-amber-500" size={24} />
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recommended Products</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {linkedProducts.map(product => (
                                <div key={product.id} className="group bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all h-full flex flex-col">
                                    <div className="aspect-square overflow-hidden bg-white">
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-5 flex flex-grow flex-col">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 min-h-[3rem] leading-tight">
                                            {product.title}
                                        </h3>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className="text-xl font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
                                            {product.originalPrice && (
                                                <span className="text-xs text-slate-400 line-through">${product.originalPrice.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <a
                                            href={product.affiliateLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                                        >
                                            View on Amazon <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </article>
            <Footer />
        </div>
    );
};
