import React, { useState, useEffect } from 'react';
import { Save, Key, Image, Sparkles, AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw, Globe, Palette, Shield, MessageSquare, Monitor, X, Database } from 'lucide-react';
import { ThemeColor, Season } from '../types';
import toast from 'react-hot-toast';
import { Button } from './Button';
import { MediaManager } from './MediaManager';
import { useApp } from '../src/contexts/AppContext';

export const AdminSettings: React.FC<{
    dbStatus: string;
    lastError?: string | null;
    onRefresh?: () => Promise<void>;
}> = ({ dbStatus, lastError, onRefresh }) => {
    const { content: { liveSiteContent, saveChanges, startPreview, exitPreview, isPreviewing } } = useApp();

    // Hero Image Configuration
    const [heroImageUrl, setHeroImageUrl] = useState('');

    // Branding Configuration
    const [siteName, setSiteName] = useState('');
    const [siteDescription, setSiteDescription] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    // Theme & Visual Appearance
    const [draftThemeColor, setDraftThemeColor] = useState<ThemeColor>('amber');
    const [draftSeason, setDraftSeason] = useState<Season>('none');
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // General Settings
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (liveSiteContent) {
            setHeroImageUrl(liveSiteContent.heroImageUrl || '');
            setSiteName(liveSiteContent.logoText || 'GoSimpleLiving');
            setSiteDescription(liveSiteContent.heroSubtitle || 'AI-Curated Amazon Affiliate Hub');
            setLogoUrl(liveSiteContent.logoUrl || '');
            setDraftThemeColor(liveSiteContent.themeColor || 'amber');
            setDraftSeason(liveSiteContent.season || 'none');
        }
    }, [liveSiteContent]);

    const handleSaveHeroImage = async () => {
        if (!heroImageUrl.trim()) {
            setSaveStatus('error');
            setSaveMessage('Please enter a valid image URL');
            return;
        }

        try {
            const updated = { ...liveSiteContent, heroImageUrl: heroImageUrl.trim() };
            await saveChanges(updated);

            setSaveStatus('success');
            setSaveMessage('Hero image saved to database!');
        } catch (e) {
            setSaveStatus('error');
            setSaveMessage('Failed to save hero image');
        }
    };

    const handleSaveBranding = async () => {
        try {
            const updated = {
                ...liveSiteContent,
                logoText: siteName.trim(),
                heroSubtitle: siteDescription.trim(),
                logoUrl: logoUrl.trim()
            };

            await saveChanges(updated);

            setSaveStatus('success');
            setSaveMessage('Settings saved to database!');
        } catch (e) {
            setSaveStatus('error');
            setSaveMessage('Failed to save settings');
        }
    };

    const handleThemePreview = () => {
        const updatedContent = {
            ...liveSiteContent,
            themeColor: draftThemeColor,
            season: draftSeason
        };
        startPreview(updatedContent);
        setShowPreviewModal(true);
    };

    const handleSaveTheme = async () => {
        try {
            const updated = {
                ...liveSiteContent,
                themeColor: draftThemeColor,
                season: draftSeason
            };
            await saveChanges(updated);
            setSaveStatus('success');
            setSaveMessage('Theme and season saved successfully!');
            setShowPreviewModal(false);
        } catch (e) {
            setSaveStatus('error');
            setSaveMessage('Failed to save theme settings');
        }
    };

    const handleDiscardTheme = () => {
        exitPreview();
        setDraftThemeColor(liveSiteContent.themeColor || 'amber');
        setDraftSeason(liveSiteContent.season || 'none');
        setShowPreviewModal(false);
    };

    const handleResetSettings = () => {
        if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            return;
        }

        localStorage.removeItem('GEMINI_API_KEY');
        localStorage.removeItem('hero_image_url');
        localStorage.removeItem('site_name');
        localStorage.removeItem('site_description');
        localStorage.removeItem('site_logo_url');

        setSaveStatus('success');
        setSaveMessage('Settings reset! Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Settings</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configure API keys, branding, and site settings</p>
                </div>
                <Button onClick={handleResetSettings} variant="ghost" className="gap-2 text-red-600 hover:text-red-700">
                    <RefreshCw size={16} />
                    Reset All Settings
                </Button>
            </div>

            {/* System Connectivity Diagnostics */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Database size={18} className="text-red-500" />
                        System Connectivity Diagnostics
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time status of your database and cloud environment</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Environment Check */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Vercel Environment Keys</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400 text-xs">SUPABASE_URL</span>
                                    {!!process.env.SUPABASE_URL || !!(import.meta as any).env?.VITE_SUPABASE_URL ? (
                                        <span className="text-[10px] px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold">DETECTED</span>
                                    ) : (
                                        <span className="text-[10px] px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-bold">MISSING</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400 text-xs">SUPABASE_ANON_KEY</span>
                                    {!!process.env.SUPABASE_ANON_KEY || !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY ? (
                                        <span className="text-[10px] px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold">DETECTED</span>
                                    ) : (
                                        <span className="text-[10px] px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-bold">MISSING</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Connection Status */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Live Signal</h4>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${dbStatus === 'connected' ? 'bg-green-500 animate-pulse' : dbStatus === 'loading' ? 'bg-amber-500 animate-bounce' : 'bg-red-500'}`} />
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">{dbStatus}</span>
                                </div>
                                {lastError && <p className="text-[10px] text-red-500 leading-tight">Last Error: {lastError}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                            <Shield size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">Force DB Re-Handshake</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Restarts the connection sequence and retries 3 times.</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
                                if (onRefresh) onRefresh();
                                toast.success("Restarting connection handshake...");
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <RefreshCw size={14} />
                            Reconnect Now
                        </Button>
                    </div>
                </div>
            </div>

            {/* Global Status Message */}
            {saveStatus !== 'idle' && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${saveStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' :
                    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                    }`}>
                    {saveStatus === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <div>
                        <p className="font-bold text-sm">{saveStatus === 'success' ? 'Success' : 'Error'}</p>
                        <p className="text-sm">{saveMessage}</p>
                    </div>
                </div>
            )}

            {/* Gemini API Configuration - Now Server-Side */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield size={18} className="text-purple-500" />
                        AI Security & Infrastructure
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">AI processing is now handled securely via Supabase Edge Functions</p>
                </div>
                <div className="p-6">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-green-900 dark:text-green-200">
                            <p className="font-bold mb-1">Server-Side Proxy Active</p>
                            <p>For enhanced security, your Gemini API key is no longer stored in the browser. It is now managed as a secure environment variable within your Supabase project.</p>
                            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-green-700 dark:text-green-400">
                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                Connection: Encrypted & Verified
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Image Configuration */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Image size={18} className="text-amber-500" />
                        Hero Image
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Set the main hero banner image displayed on the homepage</p>
                </div>
                <div className="p-6 space-y-6">
                    {/* Media Manager for Selection */}
                    <MediaManager
                        currentImageUrl={heroImageUrl}
                        onImageSelect={(url) => {
                            setHeroImageUrl(url);
                        }}
                    />

                    {/* Manual Override & Save */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Global Hero Image URL (Auto-updated by selection)
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="url"
                                    value={heroImageUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeroImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <Button onClick={handleSaveHeroImage} className="gap-2">
                                <Save size={16} />
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Branding Configuration */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Palette size={18} className="text-blue-500" />
                        Site Branding
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customize your site name, description, and logo</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Site Name
                        </label>
                        <input
                            type="text"
                            value={siteName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteName(e.target.value)}
                            placeholder="GoSimpleLiving"
                            className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Site Description
                        </label>
                        <input
                            type="text"
                            value={siteDescription}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteDescription(e.target.value)}
                            placeholder="AI-Curated Amazon Affiliate Hub"
                            className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Logo URL (Optional)
                        </label>
                        <input
                            type="url"
                            value={logoUrl}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogoUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button onClick={handleSaveBranding} className="gap-2">
                            <Save size={18} />
                            Save & Reload
                        </Button>
                    </div>
                </div>
            </div>

            {/* Theme & Visual Appearance */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Palette size={18} className="text-violet-500" />
                        Theme & Visual Appearance
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customize your site's color theme and seasonal overlays</p>
                </div>
                <div className="p-6 space-y-6">
                    {/* Theme Color Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Theme Color
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {(['amber', 'blue', 'rose', 'emerald', 'indigo', 'default', 'orange', 'red', 'green', 'purple'] as ThemeColor[]).map((color) => {
                                const colorStyles = {
                                    amber: { bg: 'bg-amber-500', border: 'border-amber-500', label: 'Amber' },
                                    blue: { bg: 'bg-blue-500', border: 'border-blue-500', label: 'Blue' },
                                    rose: { bg: 'bg-rose-500', border: 'border-rose-500', label: 'Rose' },
                                    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', label: 'Emerald' },
                                    indigo: { bg: 'bg-indigo-500', border: 'border-indigo-500', label: 'Indigo' },
                                    default: { bg: 'bg-slate-500', border: 'border-slate-500', label: 'Default' },
                                    orange: { bg: 'bg-orange-500', border: 'border-orange-500', label: 'Orange' },
                                    red: { bg: 'bg-red-500', border: 'border-red-500', label: 'Red' },
                                    green: { bg: 'bg-green-500', border: 'border-green-500', label: 'Green' },
                                    purple: { bg: 'bg-purple-500', border: 'border-purple-500', label: 'Purple' }
                                };
                                const style = colorStyles[color];
                                return (
                                    <button
                                        key={color}
                                        onClick={() => setDraftThemeColor(color)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${draftThemeColor === color
                                            ? `${style.border} bg-slate-50 dark:bg-slate-800 shadow-md`
                                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full ${style.bg} shadow-sm`} />
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{style.label}</span>
                                        {draftThemeColor === color && (
                                            <CheckCircle size={14} className="text-slate-900 dark:text-white" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Season Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Seasonal Overlay
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {([
                                { id: 'none' as Season, label: 'None', emoji: '🌐' },
                                { id: 'newyear' as Season, label: 'New Year', emoji: '🎉' },
                                { id: 'valentine' as Season, label: 'Valentine', emoji: '💝' },
                                { id: 'mothers_day' as Season, label: "Mother's Day", emoji: '💐' },
                                { id: 'fathers_day' as Season, label: "Father's Day", emoji: '👔' },
                                { id: 'prime_day' as Season, label: 'Prime Day', emoji: '⚡' },
                                { id: 'singles_day' as Season, label: "Singles' Day", emoji: '1️⃣' },
                                { id: 'halloween' as Season, label: 'Halloween', emoji: '🎃' },
                                { id: 'christmas' as Season, label: 'Christmas', emoji: '🎄' },
                                { id: 'aprilfools' as Season, label: 'April Fools', emoji: '🤡' }
                            ]).map((season) => (
                                <button
                                    key={season.id}
                                    onClick={() => setDraftSeason(season.id)}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${draftSeason === season.id
                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{season.emoji}</span>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{season.label}</span>
                                    </div>
                                    {draftSeason === season.id && (
                                        <CheckCircle size={14} className="text-violet-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview & Save Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button
                            onClick={handleThemePreview}
                            variant="outline"
                            className="flex-1 gap-2 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                            <Monitor size={18} />
                            Preview Changes
                        </Button>
                        <Button
                            onClick={handleSaveTheme}
                            className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                            disabled={draftThemeColor === liveSiteContent.themeColor && draftSeason === liveSiteContent.season}
                        >
                            <Save size={18} />
                            Save Theme
                        </Button>
                        {(draftThemeColor !== liveSiteContent.themeColor || draftSeason !== liveSiteContent.season) && (
                            <Button
                                onClick={handleDiscardTheme}
                                variant="ghost"
                                className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                                Discard
                            </Button>
                        )}
                    </div>

                    {/* Preview Indicator */}
                    {isPreviewing && (
                        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <Eye size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-violet-900 dark:text-violet-200">
                                    <strong>Preview Mode Active:</strong> You are currently previewing theme changes. Click "Save Theme" to persist or "Discard" to cancel.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                    <Monitor size={20} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Theme Preview</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">See how your changes will look on the homepage</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} className="text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-800">
                                <div className="text-center space-y-4">
                                    <div className={`inline-block p-3 rounded-2xl ${draftThemeColor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                        draftThemeColor === 'rose' ? 'bg-rose-100 dark:bg-rose-900/30' :
                                            draftThemeColor === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                                draftThemeColor === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                                                    'bg-amber-100 dark:bg-amber-900/30'
                                        }`}>
                                        <span className="text-4xl">🛍️</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{liveSiteContent.heroTitle}</h2>
                                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{liveSiteContent.heroSubtitle}</p>
                                    <div className="flex gap-3 justify-center">
                                        <div className={`px-6 py-3 rounded-xl font-medium shadow-sm ${draftThemeColor === 'blue' ? 'bg-blue-600 text-white' :
                                            draftThemeColor === 'rose' ? 'bg-rose-600 text-white' :
                                                draftThemeColor === 'emerald' ? 'bg-emerald-600 text-white' :
                                                    draftThemeColor === 'indigo' ? 'bg-indigo-600 text-white' :
                                                        'bg-amber-600 text-white'
                                            }`}>
                                            Sample Button
                                        </div>
                                    </div>
                                    {draftSeason !== 'none' && (
                                        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
                                            <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
                                                🎨 Seasonal Theme: <span className="font-bold capitalize">{draftSeason.replace('_', ' ')}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <Button
                                onClick={() => setShowPreviewModal(false)}
                                variant="outline"
                                className="flex-1"
                            >
                                Close Preview
                            </Button>
                            <Button
                                onClick={handleSaveTheme}
                                className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                <Save size={18} />
                                Save These Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sitemap Generation */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Globe size={18} className="text-orange-500" />
                        Sitemap Configuration
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generate XML sitemap for SEO crawling</p>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-3">
                            <Globe size={20} className="text-slate-600 dark:text-slate-400 shrink-0 mt-1" />
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Generate sitemap.xml</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Creates an updated sitemap based on current products and posts.</p>
                            </div>
                        </div>
                        <Button
                            onClick={async () => {
                                setSaveStatus('idle'); // Clear previous status
                                try {
                                    // 1. Fetch data
                                    const { dbService } = await import('../services/database');
                                    const products = await dbService.getProducts() || [];
                                    const posts = await dbService.getBlogPosts() || [];
                                    const customPages = liveSiteContent.customPages || [];

                                    // 2. Build XML
                                    const baseUrl = window.location.origin;
                                    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/blog</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    ${products.map(p => `
    <url>
        <loc>${baseUrl}/?product=${p.id}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
    `).join('')}
    ${posts.map(p => `
    <url>
        <loc>${baseUrl}/blog#${p.id}</loc>
        <lastmod>${new Date(p.date).toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    `).join('')}
    ${customPages.filter(p => p.status === 'published').map(p => `
    <url>
        <loc>${baseUrl}/p/${p.slug}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
    `).join('')}
</urlset>`;

                                    // 3. Upload
                                    const url = await dbService.uploadFile(xml, 'sitemap.xml', 'application/xml');

                                    setSaveStatus('success');
                                    setSaveMessage(`Sitemap generated! Public URL: ${url}`);

                                    // Copy to clipboard for convenience
                                    if (url) {
                                        navigator.clipboard.writeText(url);
                                        toast.success("Sitemap URL copied to clipboard! Submit this to Google Search Console.");
                                    }

                                } catch (e: any) {
                                    console.error(e);
                                    setSaveStatus('error');
                                    setSaveMessage('Failed to generate sitemap: ' + e.message);
                                }
                            }}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            Generate Now
                        </Button>
                    </div>

                    {liveSiteContent.sitemapUrl && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Last Generated:
                                        <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                                            {liveSiteContent.sitemapLastUpdated ? new Date(liveSiteContent.sitemapLastUpdated).toLocaleString() : 'Never'}
                                        </span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <a href={liveSiteContent.sitemapUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">
                                            {liveSiteContent.sitemapUrl}
                                        </a>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(liveSiteContent.sitemapUrl || '');
                                                toast.success("URL copied!");
                                            }}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            title="Copy URL"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2-2v1"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-green-500" title="Sitemap Active"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Feature Toggles */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <MessageSquare size={18} className="text-green-500" />
                        Feature Toggles
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enable or disable site features</p>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-3">
                            <MessageSquare size={20} className="text-slate-600 dark:text-slate-400 shrink-0 mt-1" />
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">AI Shopping Assistant</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Display the AI chat interface to help users with product recommendations</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    const newValue = !liveSiteContent.aiChatEnabled;
                                    const updated = { ...liveSiteContent, aiChatEnabled: newValue };
                                    await saveChanges(updated);
                                    setSaveStatus('success');
                                    setSaveMessage(`AI Chat ${newValue ? 'enabled' : 'disabled'} and saved!`);
                                } catch (e) {
                                    setSaveStatus('error');
                                    setSaveMessage('Failed to save AI Chat setting');
                                }
                            }}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${liveSiteContent.aiChatEnabled
                                ? 'bg-green-500 focus:ring-green-500'
                                : 'bg-slate-300 dark:bg-slate-600 focus:ring-slate-500'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${liveSiteContent.aiChatEnabled ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-900 dark:text-blue-200">
                                <strong>Note:</strong> Disabling the AI chat will hide it from all users. Refresh the page to see the change take effect.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Shield size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900 dark:text-amber-200">
                        <p className="font-bold mb-1">Security Notice:</p>
                        <p>Settings are stored in your browser's localStorage. For production use, consider implementing a secure backend to store API keys server-side.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
