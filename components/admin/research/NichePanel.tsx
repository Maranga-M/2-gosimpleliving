import React from 'react';
import { BarChart3, DollarSign, TrendingUp, Target, Search, Zap, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { NicheInsight } from '../../../services/researchService.proxy';

interface NichePanelProps {
  nicheInsight: NicheInsight | null;
  onDraftContent: () => void;
}

export const NichePanel: React.FC<NichePanelProps> = ({ nicheInsight, onDraftContent }) => {
  if (!nicheInsight) {
    return (
      <div className="text-center py-12 text-slate-400">
        <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No niche data available. Try researching again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onDraftContent} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 transition-colors">
          <Sparkles size={14} />Draft Content from Niche Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Market Size</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{nicheInsight.marketSize}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Growth Rate</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{nicheInsight.growthRate}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Target size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Competition</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{nicheInsight.competitorStrength}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
            <Search size={16} className="text-purple-500" />Top Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {nicheInsight.topKeywords.map((kw, i) => (
              <span key={i} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium border border-purple-100 dark:border-purple-800">
                {kw}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />Seasonality
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{nicheInsight.seasonality}</p>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Best Time to Promote</p>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{nicheInsight.bestTimeToPromote}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />Content Ideas
        </h4>
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
  );
};
