import React, { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { Product, SmartCollection } from '../types';
import { generateSmartCollections } from '../services/geminiService.proxy';
import { Button } from './Button';

interface SmartFilterProps {
  products: Product[];
  onSelectCollection: (productIds: string[] | null) => void;
  activeCollectionId: string | null;
}

export const SmartFilter: React.FC<SmartFilterProps> = ({ 
  products, 
  onSelectCollection,
  activeCollectionId 
}) => {
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    const results = await generateSmartCollections(products);
    setCollections(results);
    setIsLoading(false);
    setHasGenerated(true);
  };

  if (!hasGenerated && !isLoading) {
    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerate} 
            className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:hover:border-amber-700"
        >
            <Sparkles size={16} className="mr-2" />
            AI Smart Filters
        </Button>
    );
  }

  if (isLoading) {
      return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
              <Loader2 size={16} className="animate-spin" />
              Analyzing inventory...
          </div>
      );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-700">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} /> AI Collections
          </span>
      </div>
      
      {collections.map(col => (
        <button
          key={col.id}
          onClick={() => onSelectCollection(activeCollectionId === col.id ? null : col.productIds)}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all border ${
            activeCollectionId === col.id
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:text-amber-700 dark:hover:border-amber-700 dark:hover:text-amber-400'
          }`}
        >
          {col.name}
        </button>
      ))}

      <button 
        onClick={() => {
            setHasGenerated(false);
            onSelectCollection(null);
            setCollections([]);
        }}
        className="p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 ml-1"
        title="Reset AI Filters"
      >
          <X size={14} />
      </button>
    </div>
  );
};