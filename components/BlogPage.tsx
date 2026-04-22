
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Search, X, Share2, Check } from 'lucide-react';
import { BlogPost, Product, ThemeColor, AffiliateConfig } from '../types';
import { ProductCard } from './ProductCard';
import { Button } from './Button';
import { MarkdownRenderer } from './MarkdownRenderer';

interface BlogPageProps {
    posts: BlogPost[];
    products: Product[];
    onOpenProduct: (product: Product) => void;
    onGoHome: () => void;
    onRecordClick?: (productId: string) => void;
    themeColor?: ThemeColor;
    affiliateConfig?: AffiliateConfig;
}

export const BlogPage: React.FC<BlogPageProps> = ({ posts, products, onOpenProduct, onGoHome, onRecordClick, themeColor, affiliateConfig }) => {
    const [activePost, setActivePost] = useState<BlogPost | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);

    // Check URL params for deep linking
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const articleId = params.get('article');
        if (articleId && !activePost) {
            const post = posts.find(p => p.id === articleId || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === articleId);
            if (post) setActivePost(post);
        }
    }, [posts]);

    // Update URL and SEO when active post changes
    useEffect(() => {
        const url = new URL(window.location.href);
        if (activePost) {
            url.searchParams.set('article', activePost.id);
            window.history.pushState({}, '', url.toString());

            // SEO Metadata
            if (activePost.metaTitle) {
                document.title = `${activePost.metaTitle} | GoSimpleLiving`;
            } else {
                document.title = `${activePost.title} | GoSimpleLiving Blog`;
            }

            // Description meta tag
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', activePost.metaDescription || activePost.excerpt);

            // Keywords meta tag
            if (activePost.metaKeywords) {
                let metaKeywords = document.querySelector('meta[name="keywords"]');
                if (!metaKeywords) {
                    metaKeywords = document.createElement('meta');
                    metaKeywords.setAttribute('name', 'keywords');
                    document.head.appendChild(metaKeywords);
                }
                metaKeywords.setAttribute('content', activePost.metaKeywords);
            }
        } else {
            url.searchParams.delete('article');
            if (window.location.search.includes('article')) {
                window.history.pushState({}, '', url.toString());
            }

            // Reset SEO
            document.title = 'Blog | GoSimpleLiving';
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', 'Expert reviews, curated lists, and helpful articles to help you make the best choice.');
        }
    }, [activePost]);

    const handleShare = async () => {
        if (!activePost) return;
        const shareData = {
            title: activePost.title,
            text: activePost.excerpt,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Filter posts based on search query
    const filteredPosts = posts.filter(post => {
        const query = searchQuery.toLowerCase();
        return (
            post.title.toLowerCase().includes(query) ||
            post.excerpt.toLowerCase().includes(query)
        );
    });

    // If viewing a single post
    if (activePost) {
        const linkedProducts = products.filter(p => activePost.linkedProductIds.includes(p.id));
        const heroImage = activePost.heroImageUrl || activePost.image;

        return (
            <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setActivePost(null)}
                        className="flex items-center text-slate-500 dark:text-slate-300 hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft size={18} className="mr-1" /> Back to Blog
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-400 transition-colors text-sm font-medium"
                    >
                        {copied ? <Check size={16} /> : <Share2 size={16} />}
                        {copied ? 'Copied!' : 'Share'}
                    </button>
                </div>

                <article>
                    {/* Hero/Featured Image */}
                    <div className="rounded-2xl overflow-hidden mb-8 shadow-md">
                        <img src={heroImage} alt={activePost.title} className={`w-full object-cover ${activePost.heroImageUrl ? 'h-[450px] md:h-[550px]' : 'h-[400px]'}`} />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-300 mb-6">
                        <div className="flex items-center gap-1"><Calendar size={14} /> {activePost.date}</div>
                        <div className="flex items-center gap-1"><User size={14} /> {activePost.author}</div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">{activePost.title}</h1>

                    <MarkdownRenderer content={activePost.content} tables={activePost.comparisonTables} />
                </article>

                {linkedProducts.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-12 mt-12">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Featured in this article</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {linkedProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onOpenDetails={onOpenProduct}
                                    onRecordClick={onRecordClick}
                                    themeColor={themeColor}
                                    affiliateConfig={affiliateConfig}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Blog Listing
    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Latest Insights & Articles</h2>
                <p className="text-lg text-slate-500 dark:text-slate-300 max-w-2xl mx-auto mb-8">Expert reviews, curated lists, and helpful articles to help you make the best choice.</p>

                {/* Search Bar */}
                <div className="max-w-md mx-auto relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-full leading-5 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm shadow-sm transition-all text-slate-900 dark:text-slate-100"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title="Clear search"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map(post => (
                    <div
                        key={post.id}
                        className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col h-full hover:-translate-y-1 duration-300"
                        onClick={() => setActivePost(post)}
                    >
                        <div className="h-48 overflow-hidden relative">
                            <img
                                src={post.image}
                                alt={post.title}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <span className="text-white text-sm font-medium">Read Article →</span>
                            </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Article</div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-amber-600 transition-colors line-clamp-2">{post.title}</h3>
                            <p className="text-slate-500 dark:text-slate-300 mb-4 line-clamp-3 text-sm flex-1">{post.excerpt}</p>

                            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-300 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                                <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredPosts.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Search size={32} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                        {searchQuery ? `No articles found matching "${searchQuery}"` : "No blog posts published yet."}
                    </p>
                    {searchQuery ? (
                        <Button onClick={() => setSearchQuery('')} variant="ghost" className="mt-4 text-amber-600 hover:text-amber-700">Clear Search</Button>
                    ) : (
                        <Button onClick={onGoHome} variant="ghost" className="mt-4">Back to Shop</Button>
                    )}
                </div>
            )}
        </div>
    );
};
