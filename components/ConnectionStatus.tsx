import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { connectionManager, ConnectionState } from '../services/connectionManager';
import { useApp } from '../src/contexts/AppContext';

/**
 * ConnectionStatus — Admin-only floating widget.
 * 
 * Shows DB health at a glance. On the Supabase Free Tier the project
 * pauses after inactivity, showing a distinct "Paused" state with a
 * direct link to the Supabase dashboard so the admin can restore it
 * in one click.
 */

export const ConnectionStatus: React.FC = () => {
    const { refreshData, auth, isDbPaused } = useApp();
    const [state, setState] = useState<ConnectionState>(connectionManager.getState());
    const [isVisible, setIsVisible] = useState(false);

    // Admin-only — never shown to regular users
    if (auth.user?.role !== 'admin') return null;

    useEffect(() => {
        const unsubscribe = connectionManager.subscribe((newState) => {
            setState(newState);
            setIsVisible(true);
            if (newState.status === 'connected') {
                const timer = setTimeout(() => setIsVisible(false), 5000);
                return () => clearTimeout(timer);
            }
            return undefined;
        });
        return () => unsubscribe();
    }, []);

    const getStatusIcon = () => {
        if (isDbPaused) return <AlertTriangle className="text-orange-500" size={16} />;
        switch (state.status) {
            case 'connected':    return <CheckCircle2 className="text-emerald-500" size={16} />;
            case 'offline':      return <WifiOff className="text-rose-500" size={16} />;
            case 'reconnecting':
            case 'loading':      return <RefreshCw className="text-amber-500 animate-spin" size={16} />;
            default:             return <Wifi size={16} />;
        }
    };

    const getStatusText = () => {
        if (isDbPaused) return 'Database Paused';
        switch (state.status) {
            case 'connected':    return 'Database Online';
            case 'offline':      return 'Database Offline';
            case 'reconnecting': return 'Reconnecting…';
            case 'loading':      return 'Initializing…';
            default:             return 'Checking Connection';
        }
    };

    const getIconBg = () => {
        if (isDbPaused) return 'bg-orange-50 dark:bg-orange-900/20';
        if (state.status === 'connected') return 'bg-emerald-50 dark:bg-emerald-900/20';
        if (state.status === 'offline')   return 'bg-rose-50 dark:bg-rose-900/20';
        return 'bg-amber-50 dark:bg-amber-900/20';
    };

    const lastSyncTime = state.lastSuccessfulConnection
        ? new Date(state.lastSuccessfulConnection).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Never';

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => state.status === 'connected' && !isDbPaused && setIsVisible(false)}
        >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 min-w-[260px]">

                {/* Status row */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full shrink-0 ${getIconBg()}`}>
                        {getStatusIcon()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                            {getStatusText()}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <Clock size={10} />
                            <span>Last sync: {lastSyncTime}</span>
                        </div>
                    </div>

                    {(state.status === 'offline' || isDbPaused) && (
                        <button
                            onClick={() => {
                                connectionManager.markLoading();
                                refreshData();
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-500 shrink-0"
                            title="Retry Connection"
                        >
                            <RefreshCw size={14} />
                        </button>
                    )}
                </div>

                {/* Free-tier paused banner */}
                {isDbPaused && (
                    <div className="border-t border-orange-100 dark:border-orange-900/30 pt-3 space-y-2">
                        <p className="text-xs text-orange-700 dark:text-orange-400 leading-snug">
                            Your Supabase free-tier project has been <strong>paused due to inactivity</strong>.
                            Visit the dashboard to restore it — takes ~30 seconds.
                        </p>
                        <a
                            href="https://supabase.com/dashboard/projects"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            <ExternalLink size={12} />
                            Open Supabase Dashboard
                        </a>
                        <button
                            onClick={() => {
                                connectionManager.markLoading();
                                refreshData();
                            }}
                            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
                        >
                            <RefreshCw size={12} />
                            Retry Connection
                        </button>
                    </div>
                )}

                {/* Generic offline hint (non-paused) */}
                {state.status === 'offline' && !isDbPaused && state.lastError && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                            {state.lastError}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
