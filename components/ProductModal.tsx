
import React, { useState } from 'react';
import { X, Send, User, Heart, ExternalLink } from 'lucide-react';
import { Product, Review, ThemeColor } from '../types';
import { AFFILIATE_THEMES, AffiliateTheme } from '../themeConfig';
import { Button } from './Button';
import { StarRating } from './StarRating';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddReview: (productId: string, review: Review) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onRecordClick?: (productId: string) => void;
  themeColor?: ThemeColor;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddReview,
  isWishlisted = false,
  onToggleWishlist,
  onRecordClick,
  themeColor = 'amber'
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');

  if (!isOpen) return null;

  const handleSubmitReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim() || !userName.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      userName,
      rating,
      comment,
      date: new Date().toLocaleDateString()
    };

    onAddReview(product.id, newReview);
    setRating(0);
    setComment('');
    setUserName('');
  };

  const handleBuyClick = () => {
    if (onRecordClick) {
      onRecordClick(product.id);
    }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Theme Color Helpers
  const getFeatureBg = () => {
    switch (themeColor) {
      case 'blue': return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30";
      case 'rose': return "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30";
      case 'emerald': return "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30";
      case 'indigo': return "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30";
      default: return "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30";
    }
  };
  const getFeatureText = () => {
    switch (themeColor) {
      case 'blue': return "text-blue-900 dark:text-blue-100";
      case 'rose': return "text-rose-900 dark:text-rose-100";
      case 'emerald': return "text-emerald-900 dark:text-emerald-100";
      case 'indigo': return "text-indigo-900 dark:text-indigo-100";
      default: return "text-amber-900 dark:text-amber-100";
    }
  };
  const getFeatureBullet = () => {
    switch (themeColor) {
      case 'blue': return "bg-blue-500";
      case 'rose': return "bg-rose-500";
      case 'emerald': return "bg-emerald-500";
      case 'indigo': return "bg-indigo-500";
      default: return "bg-amber-500";
    }
  };

  const getAffiliateButtonStyle = (theme?: string) => {
    const themeKey = (theme as AffiliateTheme) || 'orange'; // Default to orange for modal primary button if unused
    // If the theme is explicit 'default', use default classes. If undefined, fallback to orange for primary.
    if (!theme) return AFFILIATE_THEMES.orange.classes;
    return AFFILIATE_THEMES[themeKey]?.classes || AFFILIATE_THEMES.orange.classes;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-slate-800/80 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X size={20} className="text-slate-500 dark:text-slate-400" />
        </button>

        {/* Left: Image & Key Info */}
        <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-800/50 p-8 flex flex-col overflow-y-auto border-r border-slate-100 dark:border-slate-800">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-white mb-6 shadow-sm group">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-contain"
            />
            {discount > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                Save {discount}%
              </div>
            )}
          </div>

          <div className="mt-auto">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{product.title}</h2>
              {onToggleWishlist && (
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className={`p-2 rounded-full border transition-all ${isWishlisted ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 text-red-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-200'}`}
                  title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={20} className={isWishlisted ? "fill-current" : ""} />
                </button>
              )}
            </div>

            <div className="flex items-end gap-3 mb-6">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-lg text-slate-400 dark:text-slate-600 line-through mb-1">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <a
                href={product.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                onClick={handleBuyClick}
              >
                <button
                  className={`w-full font-bold text-lg py-3 rounded-xl shadow-lg hover:shadow-xl transform transition-all active:scale-95 flex items-center justify-center gap-2 border ${getAffiliateButtonStyle(product.affiliateLinkTheme || 'orange')}`}
                >
                  {product.affiliateLinkLabel || "Buy on Amazon"} <ExternalLink size={20} />
                </button>
              </a>
              <div className={`p-4 rounded-xl border ${getFeatureBg()}`}>
                <h4 className={`font-semibold mb-2 text-sm ${getFeatureText()}`}>Key Features</h4>
                <ul className="space-y-1">
                  {product.features.map((feat: string, i: number) => (
                    <li key={i} className={`flex items-start gap-2 text-sm opacity-90 ${getFeatureText()}`}>
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${getFeatureBullet()}`} />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Details & Reviews */}
        <div className="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col bg-white dark:bg-slate-900">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Description</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{product.description}</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">User Reviews</h3>
              <div className="flex items-center gap-2">
                <StarRating rating={product.rating} size={18} />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {product.reviews + (product.localReviews?.length || 0)} ratings
                </span>
              </div>
            </div>

            {/* Review List */}
            <div className="space-y-4 mb-8">
              {product.localReviews && product.localReviews.length > 0 ? (
                product.localReviews.map((review: Review) => (
                  <div key={review.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <User size={14} />
                        </div>
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{review.userName}</span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{review.date}</span>
                    </div>
                    <StarRating rating={review.rating} size={14} className="mb-2" />
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No user reviews yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
