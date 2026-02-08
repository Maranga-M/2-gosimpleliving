import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag, FileText, Shield, Globe } from 'lucide-react';

export const SitemapPage: React.FC = () => {
    const { products, blog, content } = useApp();
    const allProducts = products.products || [];
    const allPosts = blog.blogPosts || [];
    const customPages = content.liveSiteContent.customPages || [];

    const categories = Array.from(new Set(allProducts.map(p => p.category))).sort();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Sitemap</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    A complete overview of all pages and content on our site.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main Pages */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Home size={20} className="text-amber-500" />
                        Main Pages
                    </h2>
                    <ul className="space-y-3">
                        <li>
                            <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link to="/blog" className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                Blog
                            </Link>
                        </li>
                        <li>
                            <Link to="/wishlist" className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                My Wishlist
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin" className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                Admin Dashboard
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Legal & Tech */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-blue-500" />
                        Legal & Information
                    </h2>
                    <ul className="space-y-3">
                        <li>
                            <Link to="/privacy-policy" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link to="/sitemap" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                Sitemap (You are here)
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Products by Category */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 md:col-span-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-green-500" />
                        Products by Category
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        {categories.map(cat => (
                            <div key={cat}>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">{cat}</h3>
                                <ul className="space-y-2">
                                    {allProducts.filter(p => p.category === cat && p.status === 'published').map(p => (
                                        <li key={p.id}>
                                            <a href={p.affiliateLink} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:underline block truncate">
                                                {p.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Pages */}
                {customPages.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 md:col-span-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Globe size={20} className="text-amber-600" />
                            Custom Landing Pages
                        </h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customPages.filter(page => page.status === 'published').map(page => (
                                <li key={page.id}>
                                    <Link to={`/p/${page.slug}`} className="block p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-900/30">
                                        <span className="font-bold text-slate-900 dark:text-white block mb-1">
                                            {page.title}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono">
                                            /p/{page.slug}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Blog Posts */}
                {allPosts.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 md:col-span-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <FileText size={20} className="text-purple-500" />
                            Latest Articles
                        </h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allPosts.filter(post => post.status === 'published').map(post => (
                                <li key={post.id}>
                                    <Link to={`/blog?article=${post.id}`} className="block p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1 block">
                                            {post.date}
                                        </span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {post.title}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
