import React, { useState, useMemo } from 'react';
import { X, Search, FileText, Package, Globe } from 'lucide-react';
import { Product, BlogPost, CustomPage } from '../types';

interface LinkPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectLink: (url: string, text: string) => void;
    products: Product[];
    blogPosts: BlogPost[];
    customPages?: CustomPage[];
}

type LinkType = 'product' | 'blog' | 'page';

export const LinkPickerModal: React.FC<LinkPickerModalProps> = ({
    isOpen,
    onClose,
    onSelectLink,
    products,
    blogPosts,
    customPages
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<LinkType>('product');

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products.filter(p => p.status === 'published').slice(0, 10);
        return products.filter(p =>
            p.status === 'published' &&
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10);
    }, [products, searchQuery]);

    const filteredBlogPosts = useMemo(() => {
        if (!searchQuery) return blogPosts.filter(p => p.status === 'published').slice(0, 10);
        return blogPosts.filter(p =>
            p.status === 'published' &&
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10);
    }, [blogPosts, searchQuery]);

    const filteredPages = useMemo(() => {
        const pages = customPages || [];
        if (!searchQuery) return pages.filter(p => p.status === 'published').slice(0, 10);
        return pages.filter(p =>
            p.status === 'published' &&
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10);
    }, [customPages, searchQuery]);

    const handleSelectProduct = (product: Product) => {
        onSelectLink(`/?product=${product.id}`, product.title);
        onClose();
        setSearchQuery('');
    };

    const handleSelectBlogPost = (post: BlogPost) => {
        onSelectLink(`/blog#${post.id}`, post.title);
        onClose();
        setSearchQuery('');
    };

    const handleSelectPage = (page: CustomPage) => {
        onSelectLink(`/p/${page.slug}`, page.title);
        onClose();
        setSearchQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Insert Internal Link</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Link to products, blog posts, or custom pages</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Type Selector */}
                <div className="flex gap-2 p-4 border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setSelectedType('product')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === 'product'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Package size={16} />
                        Products
                    </button>
                    <button
                        onClick={() => setSelectedType('blog')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === 'blog'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <FileText size={16} />
                        Blog Posts
                    </button>
                    <button
                        onClick={() => setSelectedType('page')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === 'page'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Globe size={16} />
                        Custom Pages
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${selectedType === 'product' ? 'products' : selectedType === 'blog' ? 'blog posts' : 'pages'}...`}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {selectedType === 'product' && (
                        <div className="space-y-2">
                            {filteredProducts.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No products found</p>
                            ) : (
                                filteredProducts.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleSelectProduct(product)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                                    >
                                        <img src={product.image} alt={product.title} className="w-12 h-12 rounded-md object-cover bg-white" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400">{product.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">${product.price.toFixed(2)} • {product.category}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {selectedType === 'blog' && (
                        <div className="space-y-2">
                            {filteredBlogPosts.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No blog posts found</p>
                            ) : (
                                filteredBlogPosts.map(post => (
                                    <button
                                        key={post.id}
                                        onClick={() => handleSelectBlogPost(post)}
                                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                                    >
                                        <FileText size={20} className="text-slate-400 mt-1 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">{post.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{post.excerpt}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {selectedType === 'page' && (
                        <div className="space-y-2">
                            {filteredPages.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No custom pages found</p>
                            ) : (
                                filteredPages.map(page => (
                                    <button
                                        key={page.id}
                                        onClick={() => handleSelectPage(page)}
                                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                                    >
                                        <Globe size={20} className="text-slate-400 mt-1 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">{page.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">/p/{page.slug}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        Click on an item to insert a markdown link at your cursor position
                    </p>
                </div>
            </div>
        </div>
    );
};
