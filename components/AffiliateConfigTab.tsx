import React, { useState } from 'react';
import { Save, Plus, Trash2, Code, CheckCircle, Eye, EyeOff, Copy, ExternalLink, TrendingUp } from 'lucide-react';
import { AffiliateConfig, TrackingCode } from '../types';
import { Button } from './Button';
import { AffiliateNetworkManager } from './AffiliateNetworkManager';
import toast from 'react-hot-toast';

interface AffiliateConfigTabProps {
    config: AffiliateConfig;
    onSave: (config: AffiliateConfig) => Promise<void>;
}

export const AffiliateConfigTab: React.FC<AffiliateConfigTabProps> = ({ config, onSave }) => {
    const [localConfig, setLocalConfig] = useState<AffiliateConfig>(config);
    const [isSaving, setIsSaving] = useState(false);
    const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(localConfig);
            toast.success('Affiliate configuration saved successfully!');
        } catch (error) {
            toast.error('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const addTrackingCode = () => {
        const newCode: TrackingCode = {
            id: `tracking-${Date.now()}`,
            name: 'New Tracking Code',
            type: 'custom',
            code: '',
            enabled: false,
            placement: 'head'
        };
        setLocalConfig({
            ...localConfig,
            trackingCodes: [...(localConfig.trackingCodes || []), newCode]
        });
    };

    const updateTrackingCode = (id: string, updates: Partial<TrackingCode>) => {
        setLocalConfig({
            ...localConfig,
            trackingCodes: localConfig.trackingCodes?.map(code =>
                code.id === id ? { ...code, ...updates } : code
            )
        });
    };

    const deleteTrackingCode = (id: string) => {
        setLocalConfig({
            ...localConfig,
            trackingCodes: localConfig.trackingCodes?.filter(code => code.id !== id)
        });
        toast.success('Tracking code removed');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const toggleCodeVisibility = (id: string) => {
        setShowCodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Affiliate Configuration</h2>
                    <p className="text-sm text-slate-500">Manage affiliate networks, verification codes, and tracking scripts.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* Global Affiliate Toggle */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500 text-white rounded-xl">
                            <ExternalLink size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Master Affiliate Control
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Enable or disable all affiliate features globally
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={localConfig.globalEnabled !== false} // Default to true
                            onChange={(e) => setLocalConfig({ ...localConfig, globalEnabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
                    </label>
                </div>
                {localConfig.globalEnabled === false && (
                    <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center gap-2">
                        <CheckCircle size={16} className="text-amber-700 dark:text-amber-400" />
                        <span className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                            All affiliate features are currently disabled. Product links will use direct URLs.
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pinterest Verification */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pinterest Verification</h3>
                            <p className="text-xs text-slate-500">Verify your domain with Pinterest</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localConfig.pinterestEnabled || false}
                                onChange={(e) => setLocalConfig({ ...localConfig, pinterestEnabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Verification Meta Tag
                            </label>
                            <textarea
                                value={localConfig.pinterestVerificationCode || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, pinterestVerificationCode: e.target.value })}
                                placeholder='<meta name="p:domain_verify" content="your-code-here"/>'
                                className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono resize-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                            />
                        </div>
                        {localConfig.pinterestVerificationCode && (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <CheckCircle size={16} className="text-amber-600 dark:text-amber-400" />
                                <span className="text-xs text-amber-700 dark:text-amber-400">Code will be injected into &lt;head&gt;</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* CJ Affiliate Configuration */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <ExternalLink size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">CJ Affiliate</h3>
                            <p className="text-xs text-slate-500">Commission Junction settings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localConfig.cjEnabled || false}
                                onChange={(e) => setLocalConfig({ ...localConfig, cjEnabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Publisher ID (PID)
                            </label>
                            <input
                                type="text"
                                value={localConfig.cjPublisherId || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, cjPublisherId: e.target.value })}
                                placeholder="Enter your CJ Publisher ID"
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Sub ID <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={localConfig.cjSubId || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, cjSubId: e.target.value })}
                                placeholder="Optional tracking sub-ID"
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Google Site Verification */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Google Verification</h3>
                            <p className="text-xs text-slate-500">Search Console verification</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Verification Code
                        </label>
                        <input
                            type="text"
                            value={localConfig.googleSiteVerification || ''}
                            onChange={(e) => setLocalConfig({ ...localConfig, googleSiteVerification: e.target.value })}
                            placeholder="Enter verification code"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white"
                        />
                    </div>
                </div>

                {/* Bing Site Verification */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5.71 3.67v8.43l3.93 2.26v-5.43l5.47 3.16v6.34l-5.47 3.15-9.64-5.57V7.83l5.71-3.3v-.86L0 7.13v9.73l11.14 6.43 11.14-6.43V7.13L11.14.7 5.71 3.67z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Bing Verification</h3>
                            <p className="text-xs text-slate-500">Webmaster Tools verification</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Verification Code
                        </label>
                        <input
                            type="text"
                            value={localConfig.bingSiteVerification || ''}
                            onChange={(e) => setLocalConfig({ ...localConfig, bingSiteVerification: e.target.value })}
                            placeholder="Enter verification code"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Monetization / AdSense */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Google AdSense</h3>
                        <p className="text-xs text-slate-500">Inject adsbygoogle.js globally</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={localConfig.adSenseEnabled || false}
                            onChange={(e) => setLocalConfig({ ...localConfig, adSenseEnabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                    </label>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Publisher Client ID
                        </label>
                        <input
                            type="text"
                            value={localConfig.adSenseClientId || ''}
                            onChange={(e) => setLocalConfig({ ...localConfig, adSenseClientId: e.target.value })}
                            placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Tracking Codes Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Code size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tracking Codes</h3>
                            <p className="text-xs text-slate-500">Manage analytics and tracking scripts</p>
                        </div>
                    </div>
                    <Button size="sm" onClick={addTrackingCode} className="gap-2">
                        <Plus size={16} />
                        Add Tracking Code
                    </Button>
                </div>

                {(!localConfig.trackingCodes || localConfig.trackingCodes.length === 0) ? (
                    <div className="text-center py-12">
                        <Code size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 mb-2">No tracking codes configured</p>
                        <p className="text-xs text-slate-400">Add Google Analytics, Facebook Pixel, or custom tracking codes</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {localConfig.trackingCodes.map((code) => (
                            <div key={code.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-start gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                                        <input
                                            type="checkbox"
                                            checked={code.enabled}
                                            onChange={(e) => updateTrackingCode(code.id, { enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                                    </label>

                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={code.name}
                                                    onChange={(e) => updateTrackingCode(code.id, { name: e.target.value })}
                                                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                                                <select
                                                    value={code.type}
                                                    onChange={(e) => updateTrackingCode(code.id, { type: e.target.value as any })}
                                                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                                >
                                                    <option value="google-analytics">Google Analytics</option>
                                                    <option value="facebook-pixel">Facebook Pixel</option>
                                                    <option value="google-tag-manager">Google Tag Manager</option>
                                                    <option value="tiktok-pixel">TikTok Pixel</option>
                                                    <option value="custom">Custom</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Code</label>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => toggleCodeVisibility(code.id)}
                                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    >
                                                        {showCodes[code.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(code.code)}
                                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <textarea
                                                value={code.code}
                                                onChange={(e) => updateTrackingCode(code.id, { code: e.target.value })}
                                                placeholder="Paste your tracking code here..."
                                                className="w-full h-24 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono resize-none dark:text-white"
                                                style={{ filter: showCodes[code.id] ? 'none' : 'blur(4px)' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Placement</label>
                                            <select
                                                value={code.placement}
                                                onChange={(e) => updateTrackingCode(code.id, { placement: e.target.value as 'head' | 'body' })}
                                                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                                            >
                                                <option value="head">Head (&lt;head&gt;)</option>
                                                <option value="body">Body (before &lt;/body&gt;)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => deleteTrackingCode(code.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Affiliate Networks Section */}
            <div className="col-span-full">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Affiliate Networks
                        </h3>
                        <p className="text-sm text-slate-500">
                            Manage multiple affiliate network integrations beyond CJ. Add ShareASale, Impact, Rakuten, and more.
                        </p>
                    </div>

                    <AffiliateNetworkManager
                        networks={localConfig.affiliateNetworks || []}
                        onChange={(networks) => setLocalConfig({ ...localConfig, affiliateNetworks: networks })}
                    />
                </div>
            </div>

            {/* Save Button (Bottom) */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </Button>
            </div>
        </div>
    );
};
