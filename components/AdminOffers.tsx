import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ExternalLink, Save, X, Image as ImageIcon } from 'lucide-react';
import { ClickBankOffer, SiteContent, Testimonial, ThemeColor } from '../types';
import { Button } from './Button';
import { v4 as uuidv4 } from 'uuid';
import { MediaManager } from './MediaManager';
import { StarRating } from './StarRating';

interface AdminOffersProps {
    siteContent: SiteContent;
    onUpdateSiteContent: (field: keyof SiteContent, value: any) => void;
    onSaveChanges: () => Promise<void>;
    themeColor: ThemeColor;
}

export const AdminOffers: React.FC<AdminOffersProps> = ({ siteContent, onUpdateSiteContent, onSaveChanges, themeColor }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentOffer, setCurrentOffer] = useState<Partial<ClickBankOffer>>({});
    const [_expandedOfferId, _setExpandedOfferId] = useState<string | null>(null);

    // Media Manager State
    const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);
    const [mediaTargetField, setMediaTargetField] = useState<'heroImageUrl' | 'productImageUrl' | null>(null);


    const offers = siteContent.clickBankOffers || [];

    const handleStartAdd = () => {
        setCurrentOffer({
            id: uuidv4(),
            title: '',
            slug: '',
            headline: '',
            subheadline: '',
            problemStatement: '',
            solutionText: '',
            affiliateLink: '',
            ctaButtonText: 'Get Instant Access',
            status: 'draft',
            features: [''],
            testimonials: []
        });
        setIsEditing(true);
    };

    const handleStartEdit = (offer: ClickBankOffer) => {
        setCurrentOffer({ ...offer });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this offer?')) {
            const updatedOffers = offers.filter(o => o.id !== id);
            onUpdateSiteContent('clickBankOffers', updatedOffers);
            await onSaveChanges();
        }
    };

    const handleSave = async () => {
        if (!currentOffer.title || !currentOffer.slug) {
            alert('Title and Slug are required');
            return;
        }

        const newOffer = currentOffer as ClickBankOffer;
        const existingIndex = offers.findIndex(o => o.id === newOffer.id);

        let updatedOffers;
        if (existingIndex >= 0) {
            updatedOffers = [...offers];
            updatedOffers[existingIndex] = newOffer;
        } else {
            updatedOffers = [...offers, newOffer];
        }

        onUpdateSiteContent('clickBankOffers', updatedOffers);
        await onSaveChanges();
        setIsEditing(false);
        setCurrentOffer({});
    };

    const updateField = (key: keyof ClickBankOffer, value: any) => {
        setCurrentOffer(prev => ({ ...prev, [key]: value }));
    };

    const handleAddFeature = () => {
        setCurrentOffer(prev => ({
            ...prev,
            features: [...(prev.features || []), '']
        }));
    };

    const updateFeature = (index: number, value: string) => {
        const newFeatures = [...(currentOffer.features || [])];
        newFeatures[index] = value;
        updateField('features', newFeatures);
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(currentOffer.features || [])];
        newFeatures.splice(index, 1);
        updateField('features', newFeatures);
    };

    // --- Testimonial Handlers ---
    const handleAddTestimonial = () => {
        const newTestimonial: Testimonial = {
            id: uuidv4(),
            name: 'New Customer',
            quote: '',
            rating: 5
        };
        setCurrentOffer(prev => ({
            ...prev,
            testimonials: [...(prev.testimonials || []), newTestimonial]
        }));
    };

    const updateTestimonial = (index: number, field: keyof Testimonial, value: any) => {
        const newTestimonials = [...(currentOffer.testimonials || [])];
        newTestimonials[index] = { ...newTestimonials[index], [field]: value };
        updateField('testimonials', newTestimonials);
    };

    const removeTestimonial = (index: number) => {
        const newTestimonials = [...(currentOffer.testimonials || [])];
        newTestimonials.splice(index, 1);
        updateField('testimonials', newTestimonials);
    };

    // --- Media Helpers ---
    const openMediaManager = (field: 'heroImageUrl' | 'productImageUrl') => {
        setMediaTargetField(field);
        setIsMediaManagerOpen(true);
    };

    const handleMediaSelect = (url: string) => {
        if (mediaTargetField) {
            updateField(mediaTargetField, url);
        }
        setIsMediaManagerOpen(false);
        setMediaTargetField(null);
    };


    if (isEditing) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold dark:text-white">{currentOffer.id ? 'Edit Offer' : 'New ClickBank Offer'}</h2>
                    <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-8 max-w-4xl">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Title</label>
                            <input
                                type="text"
                                value={currentOffer.title || ''}
                                onChange={e => updateField('title', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                placeholder="Ex: The Smoothie Diet"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Slug</label>
                            <input
                                type="text"
                                value={currentOffer.slug || ''}
                                onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                placeholder="ex: smoothie-diet"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">Affiliate Link (Hoplink)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={currentOffer.affiliateLink || ''}
                                onChange={e => updateField('affiliateLink', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono text-sm"
                                placeholder="https://hop.clickbank.net/..."
                            />
                            <Button size="sm" variant="outline" onClick={() => window.open(currentOffer.affiliateLink, '_blank')} disabled={!currentOffer.affiliateLink}>
                                <ExternalLink size={16} />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Status</label>
                            <select
                                value={currentOffer.status || 'draft'}
                                onChange={e => updateField('status', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Primary CTA Text</label>
                            <input
                                type="text"
                                value={currentOffer.ctaButtonText || ''}
                                onChange={e => updateField('ctaButtonText', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Secondary CTA (Optional)</label>
                            <input
                                type="text"
                                value={currentOffer.ctaSecondaryText || ''}
                                onChange={e => updateField('ctaSecondaryText', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                placeholder="e.g. 60-Day Guarantee"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-6"></div>
                    <h3 className="text-lg font-bold dark:text-white">Landing Page Content</h3>

                    {/* Headlines & Copy */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Main Headline</label>
                            <textarea
                                value={currentOffer.headline || ''}
                                onChange={e => updateField('headline', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white h-20 text-lg font-bold"
                                placeholder="The big benefit-driven headline..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Subheadline</label>
                            <textarea
                                value={currentOffer.subheadline || ''}
                                onChange={e => updateField('subheadline', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white h-16"
                                placeholder="Supporting text..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Problem Statement</label>
                                <textarea
                                    value={currentOffer.problemStatement || ''}
                                    onChange={e => updateField('problemStatement', e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white h-32"
                                    placeholder="Describe the pain points..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Solution Text</label>
                                <textarea
                                    value={currentOffer.solutionText || ''}
                                    onChange={e => updateField('solutionText', e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white h-32"
                                    placeholder="How this product solves it..."
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Guarantee Text</label>
                            <textarea
                                value={currentOffer.guaranteeText || ''}
                                onChange={e => updateField('guaranteeText', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white h-20"
                                placeholder="Details about the money-back guarantee..."
                            />
                        </div>
                    </div>

                    {/* Images with Media Manager */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-6"></div>
                    <h3 className="text-lg font-bold dark:text-white">Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium dark:text-slate-300">Hero Image</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentOffer.heroImageUrl || ''}
                                    onChange={e => updateField('heroImageUrl', e.target.value)}
                                    className="flex-grow p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                                    placeholder="https://..."
                                />
                                <Button size="sm" variant="outline" onClick={() => openMediaManager('heroImageUrl')}>
                                    <ImageIcon size={16} />
                                </Button>
                            </div>
                            {currentOffer.heroImageUrl && (
                                <img src={currentOffer.heroImageUrl} alt="Hero Preview" className="w-full h-32 object-cover rounded border dark:border-slate-700" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium dark:text-slate-300">Product Shot</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentOffer.productImageUrl || ''}
                                    onChange={e => updateField('productImageUrl', e.target.value)}
                                    className="flex-grow p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                                    placeholder="https://..."
                                />
                                <Button size="sm" variant="outline" onClick={() => openMediaManager('productImageUrl')}>
                                    <ImageIcon size={16} />
                                </Button>
                            </div>
                            {currentOffer.productImageUrl && (
                                <img src={currentOffer.productImageUrl} alt="Product Preview" className="w-full h-32 object-contain bg-slate-100 dark:bg-slate-800 rounded border dark:border-slate-700" />
                            )}
                        </div>
                    </div>


                    {/* Features */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-6"></div>
                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-slate-300">Key Features</label>
                        <div className="space-y-2">
                            {currentOffer.features?.map((feature, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={feature}
                                        onChange={e => updateFeature(idx, e.target.value)}
                                        className="flex-grow p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        placeholder="Feature benefit..."
                                    />
                                    <button onClick={() => removeFeature(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <Button size="sm" variant="outline" onClick={handleAddFeature} themeColor={themeColor}>
                                <Plus size={16} className="mr-2" /> Add Feature
                            </Button>
                        </div>
                    </div>

                    {/* Testimonials */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-6"></div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-medium dark:text-slate-300">Testimonials</label>
                            <Button size="sm" variant="outline" onClick={handleAddTestimonial} themeColor={themeColor}>
                                <Plus size={16} className="mr-2" /> Add Testimonial
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {currentOffer.testimonials?.map((t, idx) => (
                                <div key={t.id || idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                                    <div className="flex justify-between">
                                        <input
                                            type="text"
                                            value={t.name}
                                            onChange={e => updateTestimonial(idx, 'name', e.target.value)}
                                            className="font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none dark:text-white"
                                            placeholder="Customer Name"
                                        />
                                        <button onClick={() => removeTestimonial(idx)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                                    </div>
                                    <textarea
                                        value={t.quote}
                                        onChange={e => updateTestimonial(idx, 'quote', e.target.value)}
                                        className="w-full p-2 text-sm border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                                        placeholder="What did they say?"
                                        rows={2}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Rating:</span>
                                        <StarRating rating={t.rating || 5} interactive onChange={(r) => updateTestimonial(idx, 'rating', r)} size={16} />
                                    </div>
                                </div>
                            ))}
                            {(!currentOffer.testimonials || currentOffer.testimonials.length === 0) && (
                                <p className="text-sm text-slate-500 italic">No testimonials added yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 py-4 -mx-6 px-6 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <Button variant="outline" onClick={() => setIsEditing(false)} themeColor={themeColor}>Cancel</Button>
                        <Button onClick={handleSave} themeColor={themeColor}>
                            <Save size={18} className="mr-2" /> Save Offer
                        </Button>
                    </div>
                </div>
                {/* Media Manager Modal */}
                {isMediaManagerOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative">
                            <button
                                onClick={() => setIsMediaManagerOpen(false)}
                                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <div className="h-full overflow-y-auto">
                                <MediaManager
                                    currentImageUrl={currentOffer.heroImageUrl || currentOffer.productImageUrl || ''}
                                    onImageSelect={handleMediaSelect}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">ClickBank Offers</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage your affiliate landing pages and bridge pages.</p>
                </div>
                <Button onClick={handleStartAdd} themeColor={themeColor}>
                    <Plus size={20} className="mr-2" /> New Offer
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {offers.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        <p>No offers created yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {offers.map(offer => (
                            <div key={offer.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                            {offer.heroImageUrl ? (
                                                <img src={offer.heroImageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{offer.title}</h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${offer.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                    {offer.status}
                                                </span>
                                                <span>/offers/{offer.slug}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => window.open(`/offers/${offer.slug}`, '_blank')} themeColor={themeColor}>
                                            <ExternalLink size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleStartEdit(offer)} themeColor={themeColor}>
                                            <Edit3 size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(offer.id)} className="text-red-500 hover:text-red-700" themeColor={themeColor}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
