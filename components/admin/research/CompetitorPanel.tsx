import React, { useState } from 'react';
import { Search, Loader2, Globe, Tag, ShoppingBag, Lightbulb, TrendingUp, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../Button';
import { CompetitorAnalysis, analyzeCompetitorUrl } from '../../../services/researchService.proxy';

const STRENGTH_COLORS: Record<string, string> = {
  Weak: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Moderate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Strong: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
};

export const CompetitorPanel: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CompetitorAnalysis | null>(null);

  const handleAnalyze = async () => {
    const trimmed = url.trim();
    if (!trimmed) { toast.error('Enter a competitor URL'); return; }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const analysis = await analyzeCompetitorUrl(trimmed);
      setResult(analysis);
      toast.success('Competitor analysis complete!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to analyze URL');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Globe size={18} className="text-purple-500" />Competitor URL Analysis
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Paste a competitor affiliate blog URL to reveal their keywords, products, and content gaps you can exploit.
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://competitor-blog.com/best-wireless-earbuds"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="shrink-0">
            {isAnalyzing && <Loader2 size={16} className="animate-spin mr-2" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline flex items-center gap-1 truncate max-w-md">
              <ExternalLink size={13} />{result.url}
            </a>
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${STRENGTH_COLORS[result.overallStrength] || STRENGTH_COLORS.Moderate}`}>
              {result.overallStrength} Competition
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <Tag size={15} className="text-purple-500" />Their Top Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.topKeywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium border border-purple-100 dark:border-purple-800">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <ShoppingBag size={15} className="text-indigo-500" />Products They Promote
              </h4>
              <div className="space-y-2">
                {result.linkedProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                    <a
                      href={`https://www.amazon.com/s?k=${encodeURIComponent(p.amazonQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-500 hover:underline shrink-0"
                    >
                      ~${p.estimatedPrice} →
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <Lightbulb size={15} className="text-amber-500" />Content Gaps
              </h4>
              <ul className="space-y-2">
                {result.contentGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-amber-500 mt-0.5 shrink-0">→</span>{gap}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-500" />Affiliate Opportunities
              </h4>
              <ul className="space-y-2">
                {result.affiliateOpportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-500 mt-0.5 shrink-0">★</span>{opp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
