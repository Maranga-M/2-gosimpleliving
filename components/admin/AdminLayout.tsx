
import React from 'react';
import { RefreshCw, Wifi, WifiOff, Activity, List, Palette, FileText, Globe, DollarSign, Settings, Users as UsersIcon, Link as LinkIcon } from 'lucide-react';
import { Button } from '../Button';
import { ConnectionStatus } from '../../services/connectionManager';
import { Role } from '../../types';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: any) => void;
    dbStatus: ConnectionStatus;
    isUsingFallback: boolean;
    lastError?: string | null;
    currentUserRole: Role;
    diagnosticsLoading: boolean;
    handleTestConnection: () => Promise<void>;
    handleCloudFetch: () => Promise<void>;
    handleSeedData: () => Promise<void>;
    isSeeding: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    dbStatus,
    isUsingFallback,
    lastError,
    currentUserRole,
    diagnosticsLoading,
    handleTestConnection,
    handleCloudFetch,
    handleSeedData,
    isSeeding
}) => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your store's brain and body.</p>
                </div>
                <div className="flex items-center gap-3">
                    {dbStatus === 'loading' || dbStatus === 'reconnecting' ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                            <RefreshCw size={16} className="animate-spin" /> {dbStatus === 'loading' ? 'Syncing...' : 'Reconnecting...'}
                        </div>
                    ) : isUsingFallback ? (
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                                    <WifiOff size={16} /> Local Catalogue
                                </div>
                                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <Button size="sm" onClick={handleTestConnection} disabled={diagnosticsLoading} className="bg-purple-600 hover:bg-purple-700 text-white border-none h-8 text-[10px] gap-1.5">
                                        <Activity size={12} className={diagnosticsLoading ? 'animate-pulse' : ''} /> Test Connection
                                    </Button>
                                    <Button size="sm" onClick={handleCloudFetch} disabled={isSeeding} className="bg-blue-600 hover:bg-blue-700 text-white border-none h-8 text-[10px] gap-1.5">
                                        <RefreshCw size={12} className={isSeeding ? 'animate-spin' : ''} /> Refresh Cloud
                                    </Button>
                                    <Button size="sm" onClick={handleSeedData} disabled={isSeeding} className="bg-amber-600 hover:bg-amber-700 text-white border-none h-8 text-[10px] gap-1.5">
                                        <Wifi size={12} className="mr-1" /> Sync to DB
                                    </Button>
                                </div>
                            </div>
                            {lastError && <p className="text-[10px] text-red-500 font-medium ml-2">Error: {lastError}</p>}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                                <Wifi size={16} /> Database Live
                            </div>
                            <Button size="sm" onClick={handleTestConnection} variant="ghost" className="h-8 text-[10px]">
                                <Activity size={12} className="mr-1" /> Test
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
                <button onClick={() => onTabChange('products')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'products' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><List size={16} /> Catalogue</span>{activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                <button onClick={() => onTabChange('analytics')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'analytics' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><Activity size={16} /> Analytics</span>{activeTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                {currentUserRole === 'admin' && (
                    <button onClick={() => onTabChange('theme')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'theme' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><Palette size={16} /> Customizer</span>{activeTab === 'theme' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                )}
                <button onClick={() => onTabChange('content')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'content' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><FileText size={16} /> Blog</span>{activeTab === 'content' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                <button onClick={() => onTabChange('pages')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'pages' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><Globe size={16} /> Pages</span>{activeTab === 'pages' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                <button onClick={() => onTabChange('offers')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'offers' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><DollarSign size={16} /> Offers</span>{activeTab === 'offers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                <button onClick={() => onTabChange('affiliate-config')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'affiliate-config' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><LinkIcon size={16} /> Affiliate Config</span>{activeTab === 'affiliate-config' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                {currentUserRole === 'admin' && (
                    <>
                        <button onClick={() => onTabChange('config')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'config' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><UsersIcon size={16} /> Users</span>{activeTab === 'config' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                        <button onClick={() => onTabChange('settings')} className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'settings' ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><span className="flex items-center gap-2"><Settings size={16} /> Settings</span>{activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>}</button>
                    </>
                )}
            </div>

            <main>{children}</main>
        </div>
    );
};
