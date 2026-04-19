import React, { useState } from 'react';
import { Wand2, Loader2, Check, X, ExternalLink, RefreshCw, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { Product } from '../types';
import { fetchProductFromWeb, improveProductDescription } from '../services/geminiService';
import toast from 'react-hot-toast';

interface AISmartImportProps {
    onImport: (product: Partial<Product>) => void;
    onClose: () => void;
    categories: string[];
}

export const AISmartImport: React.FC<AISmartImportProps> = ({ onImport, onClose, categories }) => {
    const [url, setUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isRephrasing, setIsRephrasing] = useState(false);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [fetchedData, setFetchedData] = useState<Partial<Product> | null>(null);

    const handleFetch = async () => {
        if (!url.trim()) {
            toast.error('Please enter a valid link');
            return;
        }

        setIsFetching(true);
        try {
            const data = await fetchProductFromWeb(url, categories);
            if (data && data.title) {
                setFetchedData(data);
                setStep('preview');
                toast.success('Product details fetched!');
            } else {
                toast.error('Could not find product details. Try a direct product link.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to fetch product details.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleRephrase = async () => {
        if (!fetchedData) return;

        setIsRephrasing(true);
        try {
            const rephrased = await improveProductDescription(
                fetchedData.title || '',
                fetchedData.category || categories[0],
                fetchedData.description || ''
            );
            setFetchedData({ ...fetchedData, description: rephrased });
            toast.success('Content rephrased with AI!');
        } catch (error) {
            toast.error('Failed to rephrase content.');
        } finally {
            setIsRephrasing(false);
        }
    };

    const handleConfirm = () => {
        if (!fetchedData) return;

        // Final mapping and clean-up
        const finalProduct: Partial<Product> = {
            ...fetchedData,
            status: 'draft',
            affiliateLink: url.includes('amazon')
                ? (url.includes('?') ? `${url}&tag=gosimpleliving-20` : `${url}?tag=gosimpleliving-20`)
                : url
        };

        onImport(finalProduct);
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 max-w-2xl w-full mx-auto my-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Smart Magic Import</h3>
                        <p className="text-sm text-slate-500">AI-powered link processing and rephrasing.</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={20} />
                </button>
            </div>

            {step === 'input' ? (
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Link</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <LinkIcon size={18} />
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste Amazon link or product URL..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white outline-none"
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400">Supports Amazon (ASIN/URL) and other major store pages.</p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleFetch} disabled={isFetching || !url.trim()} className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]">
                            {isFetching ? <Loader2 size={18} className="animate-spin mr-2" /> : <Wand2 size={18} className="mr-2" />}
                            Fetch with AI
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex gap-4 mb-6">
                        <img
                            src={fetchedData?.image || 'https://via.placeholder.com/150'}
                            className="w-32 h-32 rounded-xl object-cover border border-slate-200 dark:border-slate-800 bg-white"
                            alt="Preview"
                        />
                        <div className="flex-1 space-y-2">
                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{fetchedData?.title}</h4>
                            <p className="text-amber-600 dark:text-amber-400 font-bold text-lg">${fetchedData?.price?.toFixed(2)}</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider">
                                    {fetchedData?.category}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Generated Description</label>
                            <button
                                onClick={handleRephrase}
                                disabled={isRephrasing}
                                className="text-[10px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 uppercase tracking-widest disabled:opacity-50"
                            >
                                {isRephrasing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                Rephrase with AI
                            </button>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {fetchedData?.description}
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <ExternalLink size={14} />
                            <span className="truncate max-w-[200px]">{url}</span>
                        </div>
                        <Check size={16} className="text-green-500" />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setStep('input')}>Go Back</Button>
                        <Button onClick={handleConfirm} className="bg-amber-600 hover:bg-amber-700 text-white min-w-[200px]">
                            <Check size={18} className="mr-2" />
                            Confirm & Add as Draft
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
