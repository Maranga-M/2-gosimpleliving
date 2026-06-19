import React, { useState, useCallback } from 'react';
import { Search, TrendingUp, Sparkles, Loader2, Target, Megaphone, BarChart3, ChevronDown, ChevronUp, Star, DollarSign, Users, Zap, ArrowUpRight, ArrowRight, ShoppingCart, Copy, ExternalLink, Lightbulb, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../Button';
import {
  TrendingProduct,
  NicheInsight,
  MarketingStrategy,
  researchTrendingProducts,
  analyzeNiche,
  generateMarketingStrategies,
} from '../../services/researchService';

interface AdminResearchProps {
  categories: string[];
  onAddProductFromResearch?: (product: { name: string; category: string; price: number; searchQuery: string }) => void;
}

const QUICK_NICHES = [
  '🏠 Smart Home Devices',
  '🏋️ Home Gym Equipment',
  '🧴 Skincare & Beauty',
  '👶 Baby Essentials',
  '🐕 Pet Supplies',
  '🎮 Gaming Accessories',
  '🌿 Outdoor & Garden',
  '📱 Phone Accessories',
  '🍳 Kitchen Gadgets',
  '📚 Self-Help Books',
];

const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors: Record<string, string> = {
    Easy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    Hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  return <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${colors[level] || colors.Medium}`}>{level}</span>;
};

const TrendBadge: React.FC<{ direction: string }> = ({ direction }) => {
  const colors: Record<string, string> = {
    Rising: 'text-emerald-600 dark:text-emerald-400',
    Stable: 'text-blue-600 dark:text-blue-400',
    Declining: 'text-red-600 dark:text-red-400',
  };
  const icons: Record<string, string> = { Rising: '📈', Stable: '📊', Declining: '📉' };
  return <span className={`flex items-center gap-1 text-xs font-bold ${colors[direction] || ''}`}>{icons[direction] || '📊'} {direction}</span>;
};

export const AdminResearch: React.FC<AdminResearchProps> = ({ categories, onAddProductFromResearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [activeSection, setActiveSection] = useState<'products' | 'niche' | 'strategies'>('products');

  // Results
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [nicheInsight, setNicheInsight] = useState<NicheInsight | null>(null);
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([]);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  const [lastQuery, setLastQuery] = useState('');

  const handleResearch = useCallback(async (query?: string) => {
    const q = (query || searchQuery).trim();
    if (!q) { toast.error('Enter a niche or product category to research.'); return; }
    setIsResearching(true);
    setLastQuery(q);
    setProducts([]);
    setNicheInsight(null);
    setStrategies([]);
    try {
      // Run all in parallel
      const [prods, insight, strats] = await Promise.allSettled([
        researchTrendingProducts(q, categories, 8),
        analyzeNiche(q),
        generateMarketingStrategies(q, []),
      ]);
      if (prods.status === 'fulfilled') setProducts(prods.value);
      else if (prods.status === 'rejected') toast.error(`Failed to research products: ${prods.reason?.message || 'Unknown error'}`);
      
      if (insight.status === 'fulfilled') setNicheInsight(insight.value);
      else if (insight.status === 'rejected') toast.error(`Failed to analyze niche: ${insight.reason?.message || 'Unknown error'}`);
      
      if (strats.status === 'fulfilled') setStrategies(strats.value);
      else if (strats.status === 'rejected') toast.error(`Failed to generate strategies: ${strats.reason?.message || 'Unknown error'}`);
      toast.success(`Research complete for "${q}"!`);
    } catch (e: any) {
      toast.error(e.message || 'Research failed.');
    } finally {
      setIsResearching(false);
    }
  }, [searchQuery, categories]);

  const handleQuickNiche = (niche: string) => {
    const clean = niche.replace(/^[^\w]+/, '').trim();
    setSearchQuery(clean);
    handleResearch(clean);
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl"><TrendingUp size={24} /></div>
            <h2 className="text-2xl font-bold">AI Market Research</h2>
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">Powered by Gemini</span>
          </div>
          <p className="text-white/80 text-sm mb-6 max-w-xl">Research trending Amazon products, analyze niches, and discover winning marketing strategies — all powered by real-time AI intelligence.</p>

          {/* Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResearch()}
                placeholder="Enter a niche, category, or product type (e.g., 'wireless earbuds', 'home office')..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
              />
            </div>
            <Button
              onClick={() => handleResearch()}
              disabled={isResearching}
              className="bg-white text-purple-700 hover:bg-white/90 border-none font-bold px-6 shadow-lg shadow-purple-900/30"
            >
              {isResearching ? <Loader2 size={18} className="animate-spin mr-2" /> : <Sparkles size={18} className="mr-2" />}
              Research
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Niche Chips */}
      {!lastQuery && (
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Quick Research — Popular Niches</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_NICHES.map(n => (
              <button key={n} onClick={() => handleQuickNiche(n)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all hover:shadow-md hover:-translate-y-0.5">
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isResearching && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 animate-spin" />
            <Sparkles size={20} className="absolute inset-0 m-auto text-purple-600 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-900 dark:text-white">Researching "{lastQuery}"...</p>
            <p className="text-sm text-slate-500">Analyzing Amazon trends, market data & strategies</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!isResearching && lastQuery && (
        <>
          {/* Section Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
            {([
              { key: 'products' as const, label: 'Trending Products', icon: ShoppingCart, count: products.length },
              { key: 'niche' as const, label: 'Niche Analysis', icon: BarChart3, count: nicheInsight ? 1 : 0 },
              { key: 'strategies' as const, label: 'Marketing Strategies', icon: Megaphone, count: strategies.length },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === tab.key ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Trending Products Section */}
          {activeSection === 'products' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">#{p.rank}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{p.name}</h4>
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
                    <Users size={12} className="text-slate-400" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex-1">{p.targetAudience}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { navigator.clipboard.writeText(p.amazonSearchQuery); toast.success('Search query copied!'); }}
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
                      {onAddProductFromResearch && (
                        <button
                          onClick={() => {
                            onAddProductFromResearch({ name: p.name, category: p.category, price: p.estimatedPrice, searchQuery: p.amazonSearchQuery });
                            toast.success(`"${p.name}" added as draft product!`);
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
              ))}
              {products.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-400">
                  <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No products found. Try a different niche.</p>
                </div>
              )}
            </div>
          )}

          {/* Niche Analysis Section */}
          {activeSection === 'niche' && nicheInsight && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"><DollarSign size={18} className="text-emerald-600" /></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Market Size</p><p className="text-lg font-bold text-slate-900 dark:text-white">{nicheInsight.marketSize}</p></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><TrendingUp size={18} className="text-blue-600" /></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Growth Rate</p><p className="text-lg font-bold text-slate-900 dark:text-white">{nicheInsight.growthRate}</p></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg"><Target size={18} className="text-purple-600" /></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Competition</p><p className="text-lg font-bold text-slate-900 dark:text-white">{nicheInsight.competitorStrength}</p></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2"><Search size={16} className="text-purple-500" /> Top Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {nicheInsight.topKeywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium border border-purple-100 dark:border-purple-800">{kw}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> Seasonality</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{nicheInsight.seasonality}</p>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Best Time to Promote</p>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{nicheInsight.bestTimeToPromote}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-amber-500" /> Content Ideas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {nicheInsight.contentIdeas.map((idea, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <ArrowRight size={14} className="text-purple-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">{idea}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeSection === 'niche' && !nicheInsight && (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No niche data available. Try researching again.</p>
            </div>
          )}

          {/* Marketing Strategies Section */}
          {activeSection === 'strategies' && (
            <div className="space-y-3">
              {strategies.map((s, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
                  <button onClick={() => setExpandedStrategy(expandedStrategy === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">{i + 1}</div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{s.strategyName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-500 font-medium">{s.platform}</span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <DifficultyBadge level={s.difficulty} />
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-[11px] text-slate-500">{s.budgetRange}</span>
                        </div>
                      </div>
                    </div>
                    {expandedStrategy === i ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </button>

                  {expandedStrategy === i && (
                    <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Expected ROI</p>
                          <p className="text-sm font-bold text-emerald-600 mt-1">{s.estimatedROI}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Time to Results</p>
                          <p className="text-sm font-bold text-blue-600 mt-1">{s.timeToResults}</p>
                        </div>
                      </div>

                      <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Implementation Steps</h5>
                      <ol className="space-y-2 mb-4">
                        {s.steps.map((step, si) => (
                          <li key={si} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{step}</p>
                          </li>
                        ))}
                      </ol>

                      {s.proTip && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                          <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">💡 Pro Tip</p>
                          <p className="text-sm text-amber-800 dark:text-amber-300">{s.proTip}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {strategies.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No strategies found. Try researching again.</p>
                </div>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={() => handleResearch(lastQuery)} variant="ghost" className="gap-2">
              <RefreshCw size={16} /> Re-run Research for "{lastQuery}"
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
