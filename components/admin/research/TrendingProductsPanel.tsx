import React from 'react';
import { Copy, ExternalLink, ShoppingCart, Star, Sparkles, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { TrendingProduct } from '../../../services/researchService.proxy';

const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors: Record<string, string> = {
    Low: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Easy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    High: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    Hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${colors[level] || colors.Medium}`}>
      {level}
    </span>
  );
};

const TrendBadge: React.FC<{ direction: string }> = ({ direction }) => {
  const colors: Record<string, string> = {
    Rising: 'text-emerald-600 dark:text-emerald-400',
    Stable: 'text-blue-600 dark:text-blue-400',
    Declining: 'text-red-600 dark:text-red-400',
  };
  const icons: Record<string, string> = { Rising: '📈', Stable: '📊', Declining: '📉' };
  return (
    <span className={`flex items-center gap-1 text-xs font-bold ${colors[direction] || ''}`}>
      {icons[direction] || '📊'} {direction}
    </span>
  );
};

interface TrendingProductsPanelProps {
  products: TrendingProduct[];
  pinnedIds: Set<string>;
  onPin: (product: TrendingProduct) => void;
  onAddToProduct: ((product: { name: string; category: string; price: number; searchQuery: string }) => void) | undefined;
  onDraftContent: () => void;
}

export const TrendingProductsPanel: React.FC<TrendingProductsPanelProps> = ({
  products, pinnedIds, onPin, onAddToProduct, onDraftContent,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No products found. Try a different niche.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onDraftContent} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 transition-colors">
          <Sparkles size={14} />Draft Blog Post from These Products
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p, i) => {
          const isPinned = pinnedIds.has(p.name);
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">#{p.rank}</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">{p.name}</h4>
                </div>
                <TrendBadge direction={p.trendDirection} />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{p.whyTrending}</p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Price</p>
                  <p className="text-sm font-bold text-emerald-600">${p.estimatedPrice}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Competition</p>
                  <DifficultyBadge level={p.competitionLevel} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Profit</p>
                  <DifficultyBadge level={p.profitPotential} />
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5 mb-3">
                <p className="text-[10px] font-bold text-purple-500 uppercase mb-1">💡 Affiliate Angle</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">{p.affiliateAngle}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Users size={12} className="text-slate-400 shrink-0" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex-1 min-w-0 truncate">{p.targetAudience}</p>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onPin(p)}
                    className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
                    title={isPinned ? 'Unpin' : 'Pin product'}
                  >
                    <Star size={14} fill={isPinned ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(p.amazonSearchQuery); toast.success('Copied!'); }}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                    title="Copy Amazon search query"
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(p.amazonSearchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                    title="Search on Amazon"
                  >
                    <ExternalLink size={14} />
                  </a>
                  {onAddToProduct && (
                    <button
                      onClick={() => {
                        onAddToProduct({ name: p.name, category: p.category, price: p.estimatedPrice, searchQuery: p.amazonSearchQuery });
                        toast.success(`"${p.name}" added as draft!`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                      title="Add as draft product"
                    >
                      <ShoppingCart size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
