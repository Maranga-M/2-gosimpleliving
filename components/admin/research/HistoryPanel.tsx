import React, { useState } from 'react';
import { Database, Star, Trash2, FolderOpen, Clock, StarOff } from 'lucide-react';
import { TrendingProduct, NicheInsight, MarketingStrategy } from '../../../services/researchService.proxy';

export interface SavedResearch {
  id: string;
  query: string;
  createdAt: string;
  products: TrendingProduct[];
  nicheInsight: NicheInsight | null;
  strategies: MarketingStrategy[];
}

export interface PinnedProduct extends TrendingProduct {
  pinnedAt: string;
  sourceQuery: string;
}

interface HistoryPanelProps {
  savedResearch: SavedResearch[];
  pinnedProducts: PinnedProduct[];
  isLoadingHistory: boolean;
  onLoad: (research: SavedResearch) => void;
  onDelete: (id: string) => void;
  onUnpin: (productName: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  savedResearch, pinnedProducts, isLoadingHistory, onLoad, onDelete, onUnpin,
}) => {
  const [subTab, setSubTab] = useState<'saved' | 'pinned'>('saved');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
        <button
          onClick={() => setSubTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === 'saved' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Database size={15} />Saved
          {savedResearch.length > 0 && (
            <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full text-[10px] font-bold">{savedResearch.length}</span>
          )}
        </button>
        <button
          onClick={() => setSubTab('pinned')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === 'pinned' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Star size={15} />Pinned
          {pinnedProducts.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full text-[10px] font-bold">{pinnedProducts.length}</span>
          )}
        </button>
      </div>

      {subTab === 'saved' && (
        <>
          {isLoadingHistory ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading history...</div>
          ) : savedResearch.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Database size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No saved research yet.</p>
              <p className="text-sm mt-1">Run a search and click Save to keep results here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedResearch.map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{r.query}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} />{new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] text-slate-400">{r.products.length} products · {r.strategies.length} strategies</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onLoad(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                    >
                      <FolderOpen size={13} />Load
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {subTab === 'pinned' && (
        <>
          {pinnedProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Star size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pinned products yet.</p>
              <p className="text-sm mt-1">Click the ★ on any product card to pin it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pinnedProducts.map((p, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-400">${p.estimatedPrice} · {p.competitionLevel} competition</span>
                      <span className="text-[11px] text-purple-500 truncate">from "{p.sourceQuery}"</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={`https://www.amazon.com/s?k=${encodeURIComponent(p.amazonSearchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      Amazon →
                    </a>
                    <button
                      onClick={() => onUnpin(p.name)}
                      className="p-1.5 text-amber-400 hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Unpin"
                    >
                      <StarOff size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
