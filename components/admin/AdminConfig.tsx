
import React from 'react';
import { Database, Activity, RefreshCw, CloudUpload, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../Button';
import { ConnectionStatus } from '../../services/connectionManager';
import { UserManagement } from '../UserManagement';
import { AdminSettings } from '../AdminSettings';
import { Product, BlogPost, SiteContent, Role } from '../../types';
import { PRODUCTS, BLOG_POSTS, INITIAL_SITE_CONTENT } from '../../constants';
import { dbService } from '../../services/database';
import toast from 'react-hot-toast';

interface AdminConfigProps {
    dbStatus: ConnectionStatus;
    isUsingFallback: boolean;
    onRefresh?: () => Promise<void>;
    lastError?: string | null;
    onSeed?: (products: Product[], posts: BlogPost[], content: SiteContent) => Promise<void>;
    diagnosticsLoading: boolean;
    handleTestConnection: () => Promise<void>;
    currentUserRole: Role;
    activeSubTab: 'users' | 'settings';
    setActiveSubTab: (tab: 'users' | 'settings') => void;
}

export const AdminConfig: React.FC<AdminConfigProps> = ({
    dbStatus,
    isUsingFallback,
    onRefresh,
    lastError,
    onSeed,
    diagnosticsLoading,
    handleTestConnection,
    currentUserRole,
    activeSubTab,
    setActiveSubTab
}) => {
    const handleSeedData = async () => {
        if (!confirm("This will synchronize your local catalogue to the live database. Existing items with same IDs will be updated. Continue?")) return;
        try {
            if (onSeed) {
                await onSeed(PRODUCTS, BLOG_POSTS, INITIAL_SITE_CONTENT);
            } else {
                await dbService.seedDatabase(PRODUCTS, BLOG_POSTS, INITIAL_SITE_CONTENT);
            }
            toast.success("Synchronization Complete!");
            if (onRefresh) await onRefresh();
            else window.location.reload();
        } catch (e) {
            toast.error("Sync Failed: Ensure your SQL tables are created in the Config tab.");
        }
    };

    const handleCloudFetch = async () => {
        if (onRefresh) {
            await onRefresh();
        }
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            {/* Connection Diagnostics Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Database size={18} className="text-blue-500" /> System Connectivity
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Status and management of your database connection</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'connected' ? 'bg-green-500 animate-pulse' : dbStatus === 'loading' ? 'bg-amber-500 animate-bounce' : 'bg-red-500'}`} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{dbStatus}</span>
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Diagnostics</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Run a deep check of environment variables and DB connection.</p>
                            </div>
                            <Button size="sm" onClick={handleTestConnection} disabled={diagnosticsLoading} className="w-full gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                <Activity size={14} className={diagnosticsLoading ? 'animate-pulse text-amber-500' : 'text-blue-500'} />
                                Run Full Test
                            </Button>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cloud Refresh</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Force a fresh fetch of all products and posts from the cloud.</p>
                            </div>
                            <Button size="sm" onClick={handleCloudFetch} className="w-full gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                <RefreshCw size={14} className="text-blue-500" />
                                Re-sync Cloud
                            </Button>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Seeding</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Upload the initial local catalogue to your Supabase instance.</p>
                            </div>
                            <Button size="sm" onClick={handleSeedData} className="w-full gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                <CloudUpload size={14} className="text-amber-500" />
                                Sync Local to DB
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-tabs for Config */}
            <div className="space-y-6">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg w-fit">
                    <button 
                        onClick={() => setActiveSubTab('users')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'users' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        User Management
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('settings')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'settings' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Branding & Visuals
                    </button>
                </div>

                {activeSubTab === 'users' ? (
                    <UserManagement />
                ) : (
                    <AdminSettings 
                        dbStatus={dbStatus} 
                        lastError={lastError || undefined} 
                        onRefresh={onRefresh || (async () => {})} 
                    />
                )}
            </div>
        </div>
    );
};
