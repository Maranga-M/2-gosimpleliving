import React from 'react';
import { ComparisonTable as ComparisonTableType, Product } from '../types';
import { ExternalLink, CheckCircle, Award } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';

interface ComparisonTableProps {
    table: ComparisonTableType;
    onProductClick?: (product: Product) => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ table, onProductClick }) => {
    const { products: productsHook, content } = useApp();
    const { products } = productsHook;
    const { siteContent } = content;

    const getThemeColor = () => {
        switch (siteContent.themeColor) {
            case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            case 'rose': return 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
            case 'emerald': return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
            case 'indigo': return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
            default: return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
        }
    };

    const getHighlightColor = () => {
        switch (siteContent.themeColor) {
            case 'blue': return 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30';
            case 'rose': return 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/30';
            case 'emerald': return 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/30';
            case 'indigo': return 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30';
            default: return 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/30';
        }
    };

    const getAccentColor = () => {
        switch (siteContent.themeColor) {
            case 'blue': return 'text-blue-600 dark:text-blue-400';
            case 'rose': return 'text-rose-600 dark:text-rose-400';
            case 'emerald': return 'text-emerald-600 dark:text-emerald-400';
            case 'indigo': return 'text-indigo-600 dark:text-indigo-400';
            default: return 'text-amber-600 dark:text-amber-400';
        }
    };

    return (
        <div className="my-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Table Title */}
            <div className="mb-6">
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <CheckCircle className={getAccentColor()} size={28} />
                    {table.title}
                </h3>
                <div className={`h-1 w-20 rounded-full ${getThemeColor().split(' ')[0].replace('bg-', 'bg-').replace('/20', '')}`}></div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
                <table className="w-full">
                    <thead>
                        <tr className={`${getThemeColor()} border-b border-slate-200 dark:border-slate-700`}>
                            <th className="py-4 px-6 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Features
                            </th>
                            {table.columns.map((col) => {
                                const product = col.productId ? products.find(p => p.id === col.productId) : null;
                                return (
                                    <th
                                        key={col.id}
                                        className={`py-4 px-6 text-center relative ${col.highlighted ? getHighlightColor() : ''}`}
                                    >
                                        {col.highlighted && (
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getThemeColor()} shadow-sm`}>
                                                    <Award size={12} />
                                                    Best Choice
                                                </span>
                                            </div>
                                        )}
                                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                                            {col.header}
                                        </div>
                                        {product && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {product.title.substring(0, 30)}...
                                            </div>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rowLabels.map((label, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                            >
                                <td className="py-4 px-6 font-semibold text-sm text-slate-700 dark:text-slate-300">
                                    {label}
                                </td>
                                {table.columns.map((col) => (
                                    <td
                                        key={col.id}
                                        className={`py-4 px-6 text-center text-sm text-slate-600 dark:text-slate-400 ${col.highlighted ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
                                    >
                                        {col.values[rowIndex] || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {/* CTA Row */}
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                            <td className="py-4 px-6"></td>
                            {table.columns.map((col) => {
                                const product = col.productId ? products.find(p => p.id === col.productId) : null;
                                return (
                                    <td key={col.id} className={`py-4 px-6 text-center ${col.highlighted ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
                                        {product && (
                                            <a
                                                href={product.affiliateLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm hover:shadow-md hover:scale-105 ${col.highlighted
                                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                                                    }`}
                                            >
                                                View Deal <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-6">
                {table.columns.map((col) => {
                    const product = col.productId ? products.find(p => p.id === col.productId) : null;
                    return (
                        <div
                            key={col.id}
                            className={`bg-white dark:bg-slate-900 rounded-2xl border-2 shadow-lg overflow-hidden ${col.highlighted ? getHighlightColor() : 'border-slate-200 dark:border-slate-800'
                                }`}
                        >
                            {/* Card Header */}
                            <div className={`p-4 ${col.highlighted ? getThemeColor() : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                {col.highlighted && (
                                    <div className="flex items-center gap-1 text-xs font-bold mb-2">
                                        <Award size={14} className={getAccentColor()} />
                                        <span className={getAccentColor()}>Best Choice</span>
                                    </div>
                                )}
                                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                                    {col.header}
                                </h4>
                                {product && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {product.title}
                                    </p>
                                )}
                            </div>

                            {/* Features List */}
                            <div className="p-4 space-y-3">
                                {table.rowLabels.map((label, rowIndex) => (
                                    <div key={rowIndex} className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                                        <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex-1">
                                            {label}
                                        </span>
                                        <span className="text-sm text-slate-600 dark:text-slate-400 text-right flex-1">
                                            {col.values[rowIndex] || '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            {product && (
                                <div className="p-4 pt-0">
                                    <a
                                        href={product.affiliateLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.02] ${col.highlighted
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                                            }`}
                                    >
                                        View Deal <ExternalLink size={16} />
                                    </a>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
