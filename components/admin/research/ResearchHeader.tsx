import React, { useState } from 'react';
import { Search, Sparkles, Loader2, Save, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../Button';

const QUICK_NICHES = [
  '🏠 Smart Home Devices', '🏋️ Home Gym Equipment', '🧴 Skincare & Beauty',
  '👶 Baby Essentials', '🐕 Pet Supplies', '🎮 Gaming Accessories',
  '🌿 Outdoor & Garden', '📱 Phone Accessories', '🍳 Kitchen Gadgets', '📚 Self-Help Books',
];

interface ResearchHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onResearch: (q?: string) => void;
  isLoading: boolean;
  hasResults: boolean;
  onSave: () => void;
  onExport: () => void;
  onClear: () => void;
  isSaving: boolean;
}

export const ResearchHeader: React.FC<ResearchHeaderProps> = ({
  searchQuery, onSearchChange, onResearch, isLoading, hasResults, onSave, onExport, onClear, isSaving,
}) => {
  const [nichesOpen, setNichesOpen] = useState(true);

  return (
    <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />
      <div className="relative z-10 space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold">AI Market Research</h2>
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">Powered by Gemini</span>
          </div>
          <p className="text-white/80 text-sm max-w-xl">Research trending Amazon products, analyze niches, and discover winning marketing strategies.</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onResearch()}
              placeholder="Enter a niche or category (e.g. 'wireless earbuds', 'home office')..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
            />
          </div>
          <Button onClick={() => onResearch()} disabled={isLoading} className="bg-white text-purple-700 hover:bg-white/90 border-none font-bold px-6 shadow-lg shadow-purple-900/30">
            {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Sparkles size={18} className="mr-2" />}
            Research
          </Button>
        </div>

        {hasResults && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-white/20">
            <Button onClick={onSave} disabled={isSaving} variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
              <Save size={16} />{isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={onExport} variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
              <Download size={16} />Export CSV
            </Button>
            <Button onClick={onClear} variant="ghost" className="gap-2 text-white/80 hover:text-white hover:bg-white/10">
              <Trash2 size={16} />Clear
            </Button>
          </div>
        )}

        <div>
          <button
            onClick={() => setNichesOpen(v => !v)}
            className="flex items-center gap-1 text-[11px] font-bold text-white/60 hover:text-white/90 uppercase tracking-wider transition-colors"
          >
            Quick Niches {nichesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {nichesOpen && (
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_NICHES.map(n => (
                <button
                  key={n}
                  onClick={() => {
                    const clean = n.replace(/^[^\w]+/, '').trim();
                    onSearchChange(clean);
                    onResearch(clean);
                  }}
                  className="px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg text-xs font-medium text-white transition-all"
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
