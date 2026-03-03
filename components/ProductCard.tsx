
import React, { useMemo } from 'react';
import { Star, TrendingUp, Heart, ExternalLink, Tag } from 'lucide-react';
import { Product, ThemeColor, AffiliateConfig } from '../types';
import { AFFILIATE_THEMES, AffiliateTheme } from '../themeConfig';
import { Button } from './Button';
import { CJService } from '../services/cjService';
import { AffiliateService } from '../services/affiliateService';

import { getOptimizedUrl } from '../supabase/service';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onRecordClick?: (productId: string) => void;
  themeColor?: ThemeColor;
  affiliateConfig?: AffiliateConfig; // CJ configuration
}


const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  isWishlisted = false,
  onToggleWishlist,
  onRecordClick,
  themeColor = 'amber',
  affiliateConfig
}) => {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const totalReviewCount = product.reviews + (product.localReviews?.length || 0);

  const handleWishlistClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  // Generate affiliate link - supports CJ (legacy) and multiple networks
  const finalAffiliateLink = useMemo(() => {
    // Check global toggle (undefined = enabled for backward compatibility)
    if (affiliateConfig?.globalEnabled === false) {
      return product.affiliateLink;
    }

    // Priority 1: CJ Affiliate (legacy support)
    if (affiliateConfig?.cjEnabled && affiliateConfig?.cjPublisherId) {
      const cjLink = CJService.generateCJLink(product.affiliateLink, affiliateConfig);
      return cjLink.affiliateUrl;
    }

    // Priority 2: Check for other affiliate networks
    const activeNetwork = AffiliateService.getActiveNetwork(affiliateConfig);
    if (activeNetwork) {
      return AffiliateService.generateAffiliateLink(
        product.affiliateLink,
        activeNetwork,
        product
      );
    }

    return product.affiliateLink;
  }, [product, affiliateConfig]);

  const handleBuyClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation(); // Prevent opening modal when clicking buy

    if (affiliateConfig?.globalEnabled !== false) {
      // Track CJ click if enabled (legacy support)
      if (affiliateConfig?.cjEnabled && affiliateConfig?.cjPublisherId) {
        const cjLink = CJService.generateCJLink(product.affiliateLink, affiliateConfig);
        CJService.trackCJClick(cjLink);
      }

      // Track other affiliate network clicks
      const activeNetwork = AffiliateService.getActiveNetwork(affiliateConfig);
      if (activeNetwork) {
        AffiliateService.trackAffiliateClick(activeNetwork, product);
      }
    }

    if (onRecordClick) {
      onRecordClick(product.id);
    }
  };

  const getStarColor = () => {
    switch (themeColor) {
      case 'blue': return "text-blue-400";
      case 'rose': return "text-rose-400";
      case 'emerald': return "text-emerald-400";
      case 'indigo': return "text-indigo-400";
      default: return "text-amber-400";
    }
  };

  const getHoverText = () => {
    switch (themeColor) {
      case 'blue': return "hover:text-blue-600 dark:hover:text-blue-400";
      case 'rose': return "hover:text-rose-600 dark:hover:text-rose-400";
      case 'emerald': return "hover:text-emerald-600 dark:hover:text-emerald-400";
      case 'indigo': return "hover:text-indigo-600 dark:hover:text-indigo-400";
      default: return "hover:text-amber-600 dark:hover:text-amber-400";
    }
  };

  const getBadgeStyle = () => {
    switch (themeColor) {
      case 'blue': return "bg-blue-600 text-white";
      case 'rose': return "bg-rose-600 text-white";
      case 'emerald': return "bg-emerald-600 text-white";
      case 'indigo': return "bg-indigo-600 text-white";
      default: return "bg-amber-500 text-slate-900";
    }
  };

  const getPromoStyle = () => {
    switch (themeColor) {
      case 'blue': return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case 'rose': return "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      case 'emerald': return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case 'indigo': return "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      default: return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
  };

  const getAffiliateButtonStyle = (theme?: string) => {
    const themeKey = (theme as AffiliateTheme) || 'default';
    return AFFILIATE_THEMES[themeKey]?.classes || AFFILIATE_THEMES.default.classes;
  };

  // Regional Pricing Logic
  const regionCode = 'UK'; // This would ideally be dynamic or from context/props
  const hasRegionalPricing = product.regionalPricing && product.regionalPricing[regionCode];
  const [selectedRegion, setSelectedRegion] = React.useState<string>(hasRegionalPricing ? 'US' : 'US'); // Default to US

  const displayPrice = selectedRegion !== 'US' && product.regionalPricing && product.regionalPricing[selectedRegion]
    ? product.regionalPricing[selectedRegion].price
    : product.price;

  const displayCurrency = selectedRegion !== 'US' && product.regionalPricing && product.regionalPricing[selectedRegion]
    ? product.regionalPricing[selectedRegion].currency
    : 'USD';

  const currencySymbol = displayCurrency === 'GBP' ? '£' : displayCurrency === 'EUR' ? '€' : '$';


  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative">
      {/* Image Container */}
      <div
        className="relative aspect-square overflow-hidden bg-white dark:bg-white p-4 cursor-pointer"
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={getOptimizedUrl(product.image, { width: 400 })}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges Stack */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          {product.isBestSeller && (
            <div className="bg-yellow-400 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 text-slate-900 backdrop-blur-sm">
              <TrendingUp size={12} /> Best Seller
            </div>
          )}
          {discount > 0 && (
            <div className={`text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 backdrop-blur-sm ${getBadgeStyle()}`}>
              <Tag size={12} className="fill-current" /> -{discount}%
            </div>
          )}
        </div>

        {/* Wishlist Button - Top Right */}
        {onToggleWishlist && (
          <button
            onClick={handleWishlistClick}
            className="absolute top-2 right-2 p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 shadow-sm backdrop-blur-md transition-all z-20 hover:scale-110 border border-slate-100 dark:border-slate-700"
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
          </button>
        )}

        {/* Hover Overlay - Quick View */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
          <Button variant="secondary" size="sm" themeColor={themeColor} className="shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto font-medium">
            Quick View
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow bg-slate-50/30 dark:bg-slate-800/20">
        <div className="flex justify-between items-start mb-1.5">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {product.category}
          </div>

          {/* Region Selector */}
          {product.regionalPricing && Object.keys(product.regionalPricing).length > 0 && (
            <div className="relative group/region z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Logic to toggle dropdown could go here, or simple hover
                }}
                className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors uppercase"
              >
                {selectedRegion}
              </button>
              <div className="absolute right-0 top-full mt-1 w-20 bg-white dark:bg-slate-800 rounded shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden hidden group-hover/region:block">
                <button onClick={(e) => { e.stopPropagation(); setSelectedRegion('US'); }} className="block w-full text-left px-2 py-1 text-[10px] hover:bg-slate-50 dark:hover:bg-slate-700">US ($)</button>
                {Object.keys(product.regionalPricing).map(region => (
                  <button key={region} onClick={(e) => { e.stopPropagation(); setSelectedRegion(region); }} className="block w-full text-left px-2 py-1 text-[10px] hover:bg-slate-50 dark:hover:bg-slate-700">{region}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <h3
          className={`font-bold text-slate-900 dark:text-white text-lg leading-tight mb-2 line-clamp-2 cursor-pointer transition-colors ${getHoverText()}`}
          title={product.title}
          onClick={() => onOpenDetails(product)}
        >
          {product.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className={`flex ${getStarColor()}`}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                className={i < Math.floor(product.rating) ? "" : "text-slate-300 dark:text-slate-700"}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">({totalReviewCount.toLocaleString()})</span>
        </div>

        {/* Features Preview */}
        <ul className="text-sm text-slate-600 dark:text-slate-400 mb-5 space-y-1.5 line-clamp-2">
          {product.features.slice(0, 2).map((feat: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mt-2 shrink-0"></span>
              <span className="leading-snug">{feat}</span>
            </li>
          ))}
        </ul>

        {/* Price & Amazon Button */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{currencySymbol}{displayPrice.toFixed(2)}</span>
                {product.originalPrice && selectedRegion === 'US' && (
                  <span className="text-sm text-slate-400 dark:text-slate-600 line-through font-medium">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {discount > 0 && selectedRegion === 'US' && (
                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getPromoStyle()}`}>
                  Save {discount}%
                </span>
              )}
            </div>

            <a
              href={finalAffiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block group/btn"
              onClick={handleBuyClick}
            >
              <button
                className={`w-full font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 text-sm border ${getAffiliateButtonStyle(product.affiliateLinkTheme || 'orange')}`}
              >
                {product.affiliateLinkLabel || "Buy on Amazon"} <ExternalLink size={16} className="transition-transform group-hover/btn:translate-x-1" />
              </button>
            </a>

            {/* Additional Affiliate Buttons */}
            {product.additionalAffiliateLinks && product.additionalAffiliateLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block group/btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRecordClick) onRecordClick(product.id);
                }}
              >
                <button
                  className={`w-full font-bold py-2 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 text-xs border ${getAffiliateButtonStyle(link.theme)}`}
                >
                  Buy on {link.label} <ExternalLink size={14} className="transition-transform group-hover/btn:translate-x-1" />
                </button>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoized export to prevent unnecessary re-renders
export const ProductCard = React.memo(ProductCardComponent);
