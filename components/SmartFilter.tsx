import React, { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { Product, SmartCollection } from '../types';
import { generateSmartCollections } from '../services/geminiService';
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
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const results = await generateSmartCollections(categories);
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
            className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-300"
        >
            <Sparkles size={16} className="mr-2" />
            AI Smart Filters
        </Button>
    );
  }

  if (isLoading) {
      return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg text-sm text-amber-700 border border-amber-100">
              <Loader2 size={16} className="animate-spin" />
              Analyzing inventory...
          </div>
      );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
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
              : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700'
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
        className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-1"
        title="Reset AI Filters"
      >
          <X size={14} />
      </button>
    </div>
  );
};