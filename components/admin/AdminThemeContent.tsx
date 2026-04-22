
import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, Loader2, Wand2, Save, X, Eye, Monitor } from 'lucide-react';
import { SiteContent, ThemeColor, Season } from '../../types';
import { Button } from '../Button';
import { MediaManager } from '../MediaManager';
import { generateSiteContent } from '../../services/geminiService';
import toast from 'react-hot-toast';

interface AdminThemeContentProps {
    liveSiteContent: SiteContent;
    categories: string[];
    onStartPreview: (draftContent: SiteContent) => void;
    onUpdateSiteContent?: (content: SiteContent) => void;
    onSaveChanges?: (content: SiteContent) => Promise<void>;
}

export const AdminThemeContent: React.FC<AdminThemeContentProps> = ({
    liveSiteContent,
    categories,
    onStartPreview,
    onUpdateSiteContent,
    onSaveChanges
}) => {
    const [draftContent, setDraftContent] = useState<SiteContent>(liveSiteContent);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setDraftContent(liveSiteContent);
    }, [liveSiteContent]);

    const handleFormChange = (field: keyof SiteContent, value: any) => {
        setDraftContent(prev => ({ ...prev, [field]: value }));
    };

    const generateCopy = async () => {
        setIsGenerating(true);
        try {
            const result = await generateSiteContent(draftContent, categories);
            setDraftContent(prev => ({ ...prev, ...result }));
            toast.success("AI Content Generated!");
        } catch (e) {
            toast.error("Failed to generate content.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveSection = async (sectionName: string) => {
        if (onSaveChanges) {
            try {
                await onSaveChanges(draftContent);
                toast.success(`${sectionName} saved to database!`);
            } catch (e: any) {
                toast.error(`Failed to save ${sectionName}. ${e?.message || 'Check your database connection.'}`);
            }
        }
    };

    const colorOptions: { id: ThemeColor, bg: string, label: string }[] = [
        { id: 'amber', bg: 'bg-amber-500', label: 'Amber' },
        { id: 'blue', bg: 'bg-blue-600', label: 'Blue' },
        { id: 'rose', bg: 'bg-rose-500', label: 'Rose' },
        { id: 'emerald', bg: 'bg-emerald-500', label: 'Emerald' },
        { id: 'indigo', bg: 'bg-indigo-600', label: 'Indigo' }
    ];

    const seasonOptions: { id: Season, label: string, emoji: string }[] = [
        { id: 'none', label: 'Default', emoji: '🏢' },
        { id: 'christmas', label: 'Christmas', emoji: '🎄' },
        { id: 'halloween', label: 'Halloween', emoji: '🎃' },
        { id: 'valentine', label: 'Valentines', emoji: '💖' },
        { id: 'prime_day', label: 'Prime Day', emoji: '📦' },
        { id: 'newyear', label: 'New Year', emoji: '🎆' }
    ];

    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            {/* Visual Customizer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Palette size={20} className="text-amber-500" /> Visual Identity
                    </h3>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Accent Color</label>
                        <div className="flex flex-wrap gap-3">
                            {colorOptions.map(color => (
                                <button
                                    key={color.id}
                                    onClick={() => handleFormChange('themeColor', color.id)}
                                    className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${draftContent.themeColor === color.id ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 ring-2 ring-slate-200 dark:ring-slate-700' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full ${color.bg} shadow-sm group-hover:scale-110 transition-transform`} />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{color.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Seasonal Mode</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {seasonOptions.map(season => (
                                <button
                                    key={season.id}
                                    onClick={() => handleFormChange('season', season.id)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${draftContent.season === season.id ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                                >
                                    <span className="text-lg">{season.emoji}</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{season.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                        <Button onClick={() => onStartPreview(draftContent)} variant="outline" className="flex-1 gap-2">
                            <Eye size={16} /> Preview Changes
                        </Button>
                        <Button onClick={() => handleSaveSection('Theme settings')} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2">
                            <Save size={16} /> Save Theme
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Monitor size={20} className="text-blue-500" /> Hero Content
                        </h3>
                        <Button onClick={generateCopy} disabled={isGenerating} size="sm" variant="ghost" className="text-purple-600 hover:bg-purple-50 gap-2">
                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                            AI Reword
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Headline</label>
                            <input
                                type="text"
                                value={draftContent.heroTitle}
                                onChange={e => handleFormChange('heroTitle', e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subtitle</label>
                            <textarea
                                value={draftContent.heroSubtitle}
                                onChange={e => handleFormChange('heroSubtitle', e.target.value)}
                                className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CTA Button Text</label>
                            <input
                                type="text"
                                value={draftContent.heroButtonText}
                                onChange={e => handleFormChange('heroButtonText', e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button onClick={() => handleSaveSection('Hero content')} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Save size={16} /> Save Content
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
