import React from 'react';
import { GoogleAd } from '../components/GoogleAd';
import { useApp } from '../contexts/AppContext';
import { Zap, Search } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';
import { Button } from '../../components/Button';



interface HomePageProps {
    onNavigate: (view: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    const { products, content, auth, dbStatus } = useApp();
    const {
        filteredProducts, categories, selectedCategory, setSelectedCategory,
        sortBy, setSortBy, searchQuery, setSearchQuery, trackProductClick
    } = products;

    const { siteContent } = content;
    const { user, toggleWishlist } = auth;

    return (
        <>
            <header className="relative bg-slate-800 bg-cover bg-center text-white" style={{ backgroundImage: `url(${siteContent.heroImageUrl})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/40"></div>
                <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold uppercase tracking-wide mb-6 border border-white/20">
                        <Zap size={14} className="text-amber-300 fill-amber-300" /> {siteContent.announcementBar || 'Welcome'}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight max-w-4xl">{siteContent.heroTitle}</h1>
                    <p className="text-lg md:text-xl text-slate-200 max-w-2xl mb-10 leading-relaxed">{siteContent.heroSubtitle}</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button size="lg" themeColor={siteContent.themeColor} onClick={() => { document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' }); }}>{siteContent.heroButtonText}</Button>
                        <Button variant="outline" size="lg" themeColor={siteContent.themeColor} onClick={() => onNavigate('blog')} className="border-white/50 text-white hover:bg-white/10">Read Our Blog</Button>
                    </div>
                </div>
            </header>


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <GoogleAd className="my-8" />
            </div>

            <div id="products-grid" className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0 justify-center flex-wrap">
                        {categories.map((cat) => (
                            <button key={cat} onClick={() => { setSelectedCategory(cat); }} className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${selectedCategory === cat ? `bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md` : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                        <label className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hidden sm:inline">Sort by:</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 cursor-pointer">
                            <option value="featured">Featured</option>
                            <option value="price-low">Low to High</option>
                            <option value="price-high">High to Low</option>
                            <option value="rating">Top Rated</option>
                        </select>
                    </div>
                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onOpenDetails={(p) => onNavigate({ type: 'open_product', product: p })}
                            isWishlisted={user?.wishlist?.includes(product.id) || false}
                            onToggleWishlist={toggleWishlist}
                            onRecordClick={trackProductClick}
                            themeColor={siteContent.themeColor}
                            affiliateConfig={siteContent.affiliateConfig}
                            amazonAssociatesId={siteContent.amazonAssociatesId}
                        />
                    ))}
                </div>
                {filteredProducts.length === 0 && dbStatus !== 'loading' && (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <h3 className="text-xl font-bold text-slate-400">No products match your filters.</h3>
                        <Button variant="ghost" className="mt-4" onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}>Clear Filters</Button>
                    </div>
                )}
            </div>
        </>
    );
};
