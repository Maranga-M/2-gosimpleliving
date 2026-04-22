
import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Save, Copy, PackagePlus, Loader2, Wand2, Search, Download, Upload, FileUp } from 'lucide-react';
import { Product, Role } from '../../types';
import { Button } from '../Button';
import { StarRating } from '../StarRating';
import { MediaManager } from '../MediaManager';
import { AFFILIATE_THEMES } from '../../themeConfig';
import { validateProduct } from '../../src/utils/validators';
import toast from 'react-hot-toast';
import { fetchProductFromWeb } from '../../services/geminiService';

interface AdminProductsProps {
    products: Product[];
    categories: string[];
    onAddProduct: (product: Product) => void;
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (id: string) => void;
    onDuplicateProduct: (id: string) => void;
    currentUserRole: Role;
    initialFormState: Product;
}

const ProductRow = React.memo(({ product, currentUserRole, onDuplicate, onEdit, onDelete, getStatusBadge }: any) => {
    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <img src={product.image} alt={product.title} loading="lazy" className="w-10 h-10 rounded-md object-cover bg-white" />
                    <span className="font-medium text-slate-900 dark:text-white truncate max-w-xs">{product.title}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">${product.price.toFixed(2)}</td>
            <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                    {(currentUserRole === 'admin' || currentUserRole === 'editor') && (
                        <button onClick={() => onDuplicate(product.id)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="Duplicate"><Copy size={18} /></button>
                    )}
                    <button onClick={() => onEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 size={18} /></button>
                    <button
                        onClick={() => onDelete(product.id, product.title)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

export const AdminProducts: React.FC<AdminProductsProps> = ({
    products,
    categories,
    onAddProduct,
    onUpdateProduct,
    onDeleteProduct,
    onDuplicateProduct,
    currentUserRole,
    initialFormState
}) => {
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Product>(initialFormState);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportCSV = () => {
        if (products.length === 0) {
            toast.error("No products to export");
            return;
        }

        const headers = ['id', 'title', 'category', 'price', 'rating', 'reviews', 'image', 'affiliateLink', 'status'];
        const csvContent = [
            headers.join(','),
            ...products.map(p => headers.map(h => {
                const val = (p as any)[h];
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `products-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Catalogue exported to CSV!");
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n').filter(l => l.trim());
                if (lines.length < 2) throw new Error("Invalid CSV format");

                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const importedProducts: Product[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                    const p: any = { ...initialFormState, id: `p-csv-${Date.now()}-${i}` };
                    
                    headers.forEach((h, idx) => {
                        if (idx < values.length) {
                            if (h === 'price' || h === 'rating' || h === 'reviews') {
                                p[h] = parseFloat(values[idx]) || 0;
                            } else {
                                p[h] = values[idx];
                            }
                        }
                    });

                    const errors = validateProduct(p as Product);
                    if (errors.length === 0) {
                        importedProducts.push(p as Product);
                    }
                }

                if (importedProducts.length > 0) {
                    importedProducts.forEach(p => onAddProduct(p));
                    toast.success(`Successfully imported ${importedProducts.length} products!`);
                } else {
                    toast.error("No valid products found in CSV");
                }
            } catch (err) {
                toast.error("Failed to parse CSV file");
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const startAdd = () => {
        setFormData({ ...initialFormState, id: Date.now().toString() });
        setIsAdding(true);
        setEditingId(null);
        setIsBulkImporting(false);
    };

    const startEdit = (product: Product) => {
        setFormData({ ...product });
        setEditingId(product.id);
        setIsAdding(false);
        setIsBulkImporting(false);
    };

    const handleSaveProduct = async (targetStatus: Product['status']) => {
        const finalData = { ...formData, status: targetStatus };
        const validationErrors = validateProduct(finalData);
        if (validationErrors.length > 0) {
            toast.error(validationErrors[0]);
            return;
        }
        if (isAdding) {
            onAddProduct(finalData);
            setIsAdding(false);
        } else {
            onUpdateProduct(finalData);
            setEditingId(null);
        }
        setFormData(initialFormState);
    };

    const handleBulkImport = async () => {
        const urls = bulkInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        if (urls.length === 0) return;

        setIsImporting(true);
        let successCount = 0;

        for (const url of urls) {
            try {
                const details = await fetchProductFromWeb(url, categories);
                if (details && details.title) {
                    const newProduct: Product = {
                        ...initialFormState,
                        ...details as Product,
                        id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        affiliateLink: url.includes('amazon')
                            ? (url.includes('?') ? `${url}&tag=gosimpleliving-20` : `${url}?tag=gosimpleliving-20`)
                            : '#',
                        status: 'draft'
                    };
                    onAddProduct(newProduct);
                    successCount++;
                }
            } catch (e) {
                console.error(`Failed to import ${url}`, e);
            }
        }

        toast.success(`Successfully processed ${successCount} products as drafts!`);
        setIsBulkImporting(false);
        setBulkInput('');
        setIsImporting(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 font-bold">Published</span>;
            case 'pending': return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 font-bold">Pending</span>;
            default: return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold">Draft</span>;
        }
    };

    const filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-300">
            {isBulkImporting ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl"><PackagePlus size={24} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bulk AI Import</h3>
                                <p className="text-sm text-slate-500">Paste Amazon product URLs or ASINs (one per line).</p>
                            </div>
                        </div>
                        <button onClick={() => setIsBulkImporting(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
                    </div>

                    <textarea
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder="https://www.amazon.com/dp/B08N5KWB9H&#10;B09G96TFF7"
                        className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500 dark:text-white mb-6 resize-none"
                    />

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsBulkImporting(false)}>Cancel</Button>
                        <Button onClick={handleBulkImport} disabled={isImporting || !bulkInput.trim()} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {isImporting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Wand2 size={18} className="mr-2" />}
                            Process with AI
                        </Button>
                    </div>
                </div>
            ) : isAdding || editingId ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{isAdding ? 'Add New Product' : 'Edit Product'}</h3>
                            <p className="text-sm text-slate-500">All changes must be saved to appear on the live site.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 mr-4 pr-4 border-r border-slate-200 dark:border-slate-800">
                                <Button variant="outline" size="sm" onClick={() => handleSaveProduct('draft')} className="text-xs h-9">Save Draft</Button>
                                <Button size="sm" onClick={() => handleSaveProduct('published')} className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white">Publish Live</Button>
                            </div>
                            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white">{categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price ($)</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" placeholder="Current price" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rating</label>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3 h-[46px]">
                                        <StarRating rating={formData.rating} interactive onChange={(r) => setFormData({ ...formData, rating: r })} />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formData.rating}</span>
                                    </div>
                                </div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Review Count</label><input type="number" value={formData.reviews} onChange={(e) => setFormData({ ...formData, reviews: parseInt(e.target.value) || 0 })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" placeholder="0" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Original Price ($) <span className="text-[10px] font-normal text-slate-400">(Optional)</span></label><input type="number" step="0.01" value={formData.originalPrice || ''} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" placeholder="Before discount" /></div>
                                <div className="flex flex-col">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Discount Preview</label>
                                    <div className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm flex items-center justify-center">
                                        {formData.originalPrice && formData.originalPrice > formData.price ? (
                                            <span className="font-bold text-green-600 dark:text-green-400">Save {Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)}%</span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">No discount</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Regional Pricing UI */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Regional Pricing</label>
                                    <Button size="sm" variant="ghost" onClick={() => {
                                        const region = prompt("Enter Region Code (e.g., UK, CA, EU):");
                                        if (region) {
                                            setFormData(prev => ({
                                                ...prev,
                                                regionalPricing: {
                                                    ...(prev.regionalPricing || {}),
                                                    [region.toUpperCase()]: { price: 0, currency: 'USD' }
                                                }
                                            }));
                                        }
                                    }} className="h-6 text-[10px]"><Plus size={12} className="mr-1" /> Add Region</Button>
                                </div>
                                {formData.regionalPricing && Object.entries(formData.regionalPricing).map(([region, data]) => (
                                    <div key={region} className="flex gap-2 mb-2 items-center">
                                        <div className="w-12 text-xs font-bold text-slate-700 dark:text-slate-300">{region}</div>
                                        <input type="number" step="0.01" value={data.price} onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                regionalPricing: {
                                                    ...prev.regionalPricing,
                                                    [region]: { ...data, price: parseFloat(e.target.value) }
                                                }
                                            }));
                                        }} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="Price" />
                                        <select value={data.currency} onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                regionalPricing: {
                                                    ...prev.regionalPricing,
                                                    [region]: { ...data, currency: e.target.value }
                                                }
                                            }));
                                        }} className="w-20 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                                            <option value="USD">USD</option>
                                            <option value="GBP">GBP</option>
                                            <option value="EUR">EUR</option>
                                            <option value="CAD">CAD</option>
                                        </select>
                                        <button onClick={() => {
                                            const newPricing = { ...formData.regionalPricing };
                                            delete (newPricing as any)[region];
                                            setFormData({ ...formData, regionalPricing: newPricing });
                                        }} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>

                            {/* Key Features UI */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Key Features</label>
                                    <Button size="sm" variant="ghost" onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            features: [...(prev.features || []), 'New Feature']
                                        }));
                                    }} className="h-6 text-[10px]"><Plus size={12} className="mr-1" /> Add Feature</Button>
                                </div>

                                {formData.features && formData.features.length === 0 && (
                                    <p className="text-xs text-slate-400 italic mb-2">No features added yet.</p>
                                )}

                                {formData.features && formData.features.map((feature, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2 items-center">
                                        <div className="w-6 text-xs font-bold text-slate-400 select-none text-center">{idx + 1}.</div>
                                        <input type="text" value={feature} onChange={(e) => {
                                            const newFeatures = [...(formData.features || [])];
                                            newFeatures[idx] = e.target.value;
                                            setFormData({ ...formData, features: newFeatures });
                                        }} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="Feature description..." />
                                        <button onClick={() => {
                                            const newFeatures = formData.features.filter((_, i) => i !== idx);
                                            setFormData({ ...formData, features: newFeatures });
                                        }} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Affiliate Links UI */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Affiliate Links</label>
                                    <Button size="sm" variant="ghost" onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            additionalAffiliateLinks: [...(prev.additionalAffiliateLinks || []), { label: 'New Store', url: '#', theme: 'default' }]
                                        }));
                                    }} className="h-6 text-[10px]"><Plus size={12} className="mr-1" /> Add Button</Button>
                                </div>
                                <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Affiliate Button</label>
                                    <div className="flex flex-col gap-2">
                                        <input type="text" value={formData.affiliateLink} onChange={(e) => setFormData({ ...formData, affiliateLink: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="URL (e.g. https://amazon.com/...)" />
                                        <div className="flex gap-2">
                                            <input type="text" value={formData.affiliateLinkLabel || ''} onChange={(e) => setFormData({ ...formData, affiliateLinkLabel: e.target.value })} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="Label (Default: Buy on Amazon)" />
                                            <select
                                                value={formData.affiliateLinkTheme || 'orange'}
                                                onChange={(e) => setFormData({ ...formData, affiliateLinkTheme: e.target.value as any })}
                                                className="w-1/3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                            >
                                                {Object.entries(AFFILIATE_THEMES).map(([key, theme]) => (
                                                    <option key={key} value={key}>{theme.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {formData.additionalAffiliateLinks && formData.additionalAffiliateLinks.map((link, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 mb-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="flex gap-2">
                                            <input type="text" value={link.label} onChange={(e) => {
                                                const newLinks = [...(formData.additionalAffiliateLinks || [])];
                                                newLinks[idx].label = e.target.value;
                                                setFormData({ ...formData, additionalAffiliateLinks: newLinks });
                                            }} className="w-1/3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="Label (e.g. Target)" />
                                            <input type="text" value={link.url} onChange={(e) => {
                                                const newLinks = [...(formData.additionalAffiliateLinks || [])];
                                                newLinks[idx].url = e.target.value;
                                                setFormData({ ...formData, additionalAffiliateLinks: newLinks });
                                            }} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" placeholder="URL" />
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={link.theme || 'default'}
                                                onChange={(e) => {
                                                    const newLinks = [...(formData.additionalAffiliateLinks || [])];
                                                    newLinks[idx].theme = e.target.value as any;
                                                    setFormData({ ...formData, additionalAffiliateLinks: newLinks });
                                                }}
                                                className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                            >
                                                {Object.entries(AFFILIATE_THEMES).map(([key, theme]) => (
                                                    <option key={key} value={key}>{theme.label}</option>
                                                ))}
                                            </select>
                                            <button onClick={() => {
                                                const newLinks = formData.additionalAffiliateLinks?.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, additionalAffiliateLinks: newLinks });
                                            }} className="p-2 text-red-500 hover:bg-red-50 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Product Image</label>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <MediaManager
                                        currentImageUrl={formData.image}
                                        onImageSelect={(url) => setFormData({ ...formData, image: url })}
                                    />
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <label className="block text-xs font-semibold text-slate-500 mb-2">Or enter URL manually</label>
                                        <input
                                            type="text"
                                            value={formData.image}
                                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search products or categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImportCSV}
                                accept=".csv"
                                className="hidden"
                            />
                            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 text-slate-600 dark:text-slate-400">
                                <FileUp size={16} /> Import CSV
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-2 text-slate-600 dark:text-slate-400">
                                <Download size={16} /> Export CSV
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsBulkImporting(true)} className="gap-2 border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800/30 dark:text-purple-400">
                                <PackagePlus size={16} /> AI Import
                            </Button>
                            <Button size="sm" onClick={startAdd} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                                <Plus size={16} /> Add Product
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredProducts.map(product => (
                                        <ProductRow
                                            key={product.id}
                                            product={product}
                                            currentUserRole={currentUserRole}
                                            onDuplicate={onDuplicateProduct}
                                            onEdit={startEdit}
                                            onDelete={onDeleteProduct}
                                            getStatusBadge={getStatusBadge}
                                        />
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                No products found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
