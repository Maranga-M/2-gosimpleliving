import React from 'react';
import { ChevronDown, ChevronUp, Megaphone, Sparkles } from 'lucide-react';
import { MarketingStrategy } from '../../../services/researchService.proxy';

const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors: Record<string, string> = {
    Easy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    Hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  return (
    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${colors[level] || colors.Medium}`}>
      {level}
    </span>
  );
};

interface StrategiesPanelProps {
  strategies: MarketingStrategy[];
  expandedIndex: number | null;
  onToggle: (i: number) => void;
  onDraftContent: () => void;
}

export const StrategiesPanel: React.FC<StrategiesPanelProps> = ({ strategies, expandedIndex, onToggle, onDraftContent }) => {
  if (strategies.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No strategies found. Try researching again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={onDraftContent} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 transition-colors">
          <Sparkles size={14} />Draft Email from Strategies
        </button>
      </div>
      {strategies.map((s, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
          <button onClick={() => onToggle(i)} className="w-full flex items-center justify-between p-5 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                {i + 1}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{s.strategyName}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">{s.platform}</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <DifficultyBadge level={s.difficulty} />
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-[11px] text-slate-500">{s.budgetRange}</span>
                </div>
              </div>
            </div>
            {expandedIndex === i ? <ChevronUp size={18} className="text-slate-400 shrink-0" /> : <ChevronDown size={18} className="text-slate-400 shrink-0" />}
          </button>

          {expandedIndex === i && (
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
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {si + 1}
                    </span>
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
    </div>
  );
};
