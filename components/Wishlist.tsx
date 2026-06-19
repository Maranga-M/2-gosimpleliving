import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product, SiteContent, ThemeColor, AffiliateConfig } from '../types';
import { ProductCard } from './ProductCard';
import { Button } from './Button';

interface WishlistProps {
  products: Product[];
  onOpenDetails: (product: Product) => void;
  onRemove: (id: string) => void;
  onGoHome: () => void;
  uiText: SiteContent['uiText'];
  themeColor?: ThemeColor;
  affiliateConfig?: AffiliateConfig;
  amazonAssociatesId?: string;
}

export const Wishlist: React.FC<WishlistProps> = ({ products, onOpenDetails, onRemove, onGoHome, uiText, themeColor, affiliateConfig, amazonAssociatesId }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500" /> {uiText.wishlistTitle}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          {products.length} {products.length === 1 ? 'item' : 'items'} saved for later
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetails={onOpenDetails}
              isWishlisted={true}
              onToggleWishlist={() => onRemove(product.id)}
              themeColor={themeColor}
              affiliateConfig={affiliateConfig}
              amazonAssociatesId={amazonAssociatesId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="text-slate-300 dark:text-slate-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{uiText.wishlistEmptyTitle}</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{uiText.wishlistEmptySubtitle}</p>
          <Button onClick={onGoHome} className="gap-2">
            <ShoppingBag size={18} /> Browse Products
          </Button>
        </div>
      )}
    </div>
  );
};
