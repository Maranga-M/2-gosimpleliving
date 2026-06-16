import React, { useState, useCallback, useEffect } from 'react';
import { ShoppingCart, BarChart3, Megaphone, Database, Globe, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../Button';
import {
  TrendingProduct, NicheInsight, MarketingStrategy,
  researchTrendingProducts, analyzeNiche, generateMarketingStrategies,
  ContentDraftContext,
} from '../../../services/researchService.proxy';
import { exportToCSV } from '../../../services/researchExport';
import { ResearchHeader } from './ResearchHeader';
import { TrendingProductsPanel } from './TrendingProductsPanel';
import { NichePanel } from './NichePanel';
import { StrategiesPanel } from './StrategiesPanel';
import { HistoryPanel, SavedResearch, PinnedProduct } from './HistoryPanel';
import { CompetitorPanel } from './CompetitorPanel';
import { ContentDraftModal } from './ContentDraftModal';

type ActiveSection = 'products' | 'niche' | 'strategies' | 'history' | 'competitor';

const PINNED_KEY = 'gsl_pinned_products';
const MAX_PINNED = 50;

const loadPinned = (): PinnedProduct[] => {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]'); } catch { return []; }
};

const savePinned = (products: PinnedProduct[]): void => {
  try { localStorage.setItem(PINNED_KEY, JSON.stringify(products)); } catch {}
};

interface AdminResearchProps {
  categories: string[];
  onAddProductFromResearch?: (product: { name: string; category: string; price: number; searchQuery: string }) => void;
  onAddBlogPost?: (content: string, title: string) => void;
}

export const AdminResearch: React.FC<AdminResearchProps> = ({ categories, onAddProductFromResearch, onAddBlogPost }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [isLoadingPhase1, setIsLoadingPhase1] = useState(false);
  const [isLoadingPhase2, setIsLoadingPhase2] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('products');

  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [nicheInsight, setNicheInsight] = useState<NicheInsight | null>(null);
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([]);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);

  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [pinnedProducts, setPinnedProducts] = useState<PinnedProduct[]>(loadPinned);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isContentDraftOpen, setIsContentDraftOpen] = useState(false);
  const [contentDraftContext, setContentDraftContext] = useState<ContentDraftContext | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { dbService } = await import('../../../services/database');
        const history = await dbService.getResearchHistory?.() || [];
        setSavedResearch(history as SavedResearch[]);
      } catch (e) {
        console.warn('Could not load research history:', e);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  const handleResearch = useCallback(async (query?: string) => {
    const q = (query || searchQuery).trim();
    if (!q) { toast.error('Enter a niche or category'); return; }

    setLastQuery(q);
    setProducts([]);
    setNicheInsight(null);
    setStrategies([]);
    setActiveSection('products');
    setExpandedStrategy(null);

    // Phase 1: products + niche in parallel
    setIsLoadingPhase1(true);
    let resolvedProducts: TrendingProduct[] = [];
    try {
      const [prods, insight] = await Promise.allSettled([
        researchTrendingProducts(q, categories, 8),
        analyzeNiche(q),
      ]);
      if (prods.status === 'fulfilled') { resolvedProducts = prods.value; setProducts(prods.value); }
      if (insight.status === 'fulfilled') setNicheInsight(insight.value);
    } finally {
      setIsLoadingPhase1(false);
    }

    // Phase 2: strategies with real product names
    setIsLoadingPhase2(true);
    try {
      const productNames = resolvedProducts.slice(0, 5).map(p => p.name);
      const strats = await generateMarketingStrategies(q, productNames);
      setStrategies(strats);
      toast.success(`Research complete for "${q}"!`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate strategies.');
    } finally {
      setIsLoadingPhase2(false);
    }
  }, [searchQuery, categories]);

  const handleSave = async () => {
    if (!lastQuery || (products.length === 0 && !nicheInsight && strategies.length === 0)) {
      toast.error('No results to save.');
      return;
    }
    setIsSaving(true);
    try {
      const { dbService } = await import('../../../services/database');
      await dbService.saveResearch?.({ query: lastQuery, products, nicheInsight, strategies, createdAt: new Date().toISOString() });
      toast.success('Saved!');
      const history = await dbService.getResearchHistory?.() || [];
      setSavedResearch(history as SavedResearch[]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!lastQuery) { toast.error('Nothing to export'); return; }
    exportToCSV(products, nicheInsight, strategies, lastQuery);
    toast.success('CSV downloaded!');
  };

  const handleClear = () => {
    setProducts([]); setNicheInsight(null); setStrategies([]);
    setLastQuery(''); setSearchQuery(''); setActiveSection('products'); setExpandedStrategy(null);
  };

  const handleLoadSaved = (research: SavedResearch) => {
    setSearchQuery(research.query); setLastQuery(research.query);
    setProducts(research.products); setNicheInsight(research.nicheInsight); setStrategies(research.strategies);
    setActiveSection('products');
    toast.success(`Loaded "${research.query}"`);
  };

  const handleDeleteSaved = async (id: string) => {
    if (!confirm('Delete this saved research?')) return;
    try {
      const { dbService } = await import('../../../services/database');
      await dbService.deleteResearch?.(id);
      const history = await dbService.getResearchHistory?.() || [];
      setSavedResearch(history as SavedResearch[]);
      toast.success('Deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleTogglePin = (product: TrendingProduct) => {
    setPinnedProducts(prev => {
      const exists = prev.some(p => p.name === product.name);
      const updated: PinnedProduct[] = exists
        ? prev.filter(p => p.name !== product.name)
        : [{ ...product, pinnedAt: new Date().toISOString(), sourceQuery: lastQuery }, ...prev].slice(0, MAX_PINNED);
      savePinned(updated);
      toast.success(exists ? 'Unpinned' : 'Pinned!');
      return updated;
    });
  };

  const handleUnpin = (productName: string) => {
    setPinnedProducts(prev => {
      const updated = prev.filter(p => p.name !== productName);
      savePinned(updated);
      return updated;
    });
    toast.success('Unpinned');
  };

  const openDraft = (context: ContentDraftContext) => {
    setContentDraftContext(context);
    setIsContentDraftOpen(true);
  };

  const isLoading = isLoadingPhase1 || isLoadingPhase2;
  const hasResults = !!(lastQuery && (products.length > 0 || nicheInsight || strategies.length > 0));
  const pinnedIds = new Set(pinnedProducts.map(p => p.name));
  const draftContext: ContentDraftContext = { query: lastQuery, products, nicheInsight, strategies };

  const TABS: { key: ActiveSection; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'products', label: 'Trending Products', icon: ShoppingCart, count: products.length },
    { key: 'niche', label: 'Niche Analysis', icon: BarChart3, count: nicheInsight ? 1 : 0 },
    { key: 'strategies', label: 'Strategies', icon: Megaphone, count: strategies.length },
    { key: 'history', label: 'History', icon: Database, count: savedResearch.length + pinnedProducts.length },
    { key: 'competitor', label: 'Competitor', icon: Globe },
  ];

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <ResearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResearch={handleResearch}
        isLoading={isLoading}
        hasResults={hasResults}
        onSave={handleSave}
        onExport={handleExport}
        onClear={handleClear}
        isSaving={isSaving}
      />

      {/* Tabs — always visible */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === tab.key ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Phase 1 loading */}
      {isLoadingPhase1 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 animate-spin" />
          <div className="text-center">
            <p className="font-bold text-slate-900 dark:text-white">Researching "{lastQuery}"...</p>
            <p className="text-sm text-slate-500">Finding trending products and analyzing the niche</p>
          </div>
        </div>
      )}

      {/* Phase 2 loading banner */}
      {!isLoadingPhase1 && isLoadingPhase2 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
          <Loader2 size={16} className="text-purple-600 animate-spin shrink-0" />
          <span className="text-sm text-purple-700 dark:text-purple-300">Generating context-aware marketing strategies...</span>
        </div>
      )}

      {/* Panels */}
      {!isLoadingPhase1 && (
        <>
          {activeSection === 'products' && (
            <TrendingProductsPanel
              products={products}
              pinnedIds={pinnedIds}
              onPin={handleTogglePin}
              onAddToProduct={onAddProductFromResearch}
              onDraftContent={() => openDraft(draftContext)}
            />
          )}
          {activeSection === 'niche' && (
            <NichePanel nicheInsight={nicheInsight} onDraftContent={() => openDraft(draftContext)} />
          )}
          {activeSection === 'strategies' && (
            <StrategiesPanel
              strategies={strategies}
              expandedIndex={expandedStrategy}
              onToggle={i => setExpandedStrategy(expandedStrategy === i ? null : i)}
              onDraftContent={() => openDraft(draftContext)}
            />
          )}
          {activeSection === 'history' && (
            <HistoryPanel
              savedResearch={savedResearch}
              pinnedProducts={pinnedProducts}
              isLoadingHistory={isLoadingHistory}
              onLoad={handleLoadSaved}
              onDelete={handleDeleteSaved}
              onUnpin={handleUnpin}
            />
          )}
          {activeSection === 'competitor' && <CompetitorPanel />}
        </>
      )}

      {/* Re-run */}
      {!isLoading && lastQuery && activeSection !== 'history' && activeSection !== 'competitor' && (
        <div className="flex justify-center pt-2">
          <Button onClick={() => handleResearch(lastQuery)} variant="ghost" className="gap-2 text-slate-500">
            <RefreshCw size={15} />Re-run for "{lastQuery}"
          </Button>
        </div>
      )}

      {contentDraftContext && (
        <ContentDraftModal
          isOpen={isContentDraftOpen}
          onClose={() => setIsContentDraftOpen(false)}
          context={contentDraftContext}
          onAddAsBlogPost={onAddBlogPost}
        />
      )}
    </div>
  );
};
