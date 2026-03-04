import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { connectionManager, ConnectionState } from '../services/connectionManager';

export const ConnectionStatus: React.FC = () => {
    const [state, setState] = useState<ConnectionState>(connectionManager.getState());
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = connectionManager.subscribe((newState) => {
            setState(newState);
            // Auto-show on changes, then hide after delay if connected
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
        switch (state.status) {
            case 'connected': return <CheckCircle2 className="text-emerald-500" size={16} />;
            case 'offline': return <WifiOff className="text-rose-500" size={16} />;
            case 'reconnecting':
            case 'loading': return <RefreshCw className="text-amber-500 animate-spin" size={16} />;
            default: return <Wifi size={16} />;
        }
    };

    const getStatusText = () => {
        switch (state.status) {
            case 'connected': return 'Database Online';
            case 'offline': return 'Database Offline';
            case 'reconnecting': return 'Reconnecting...';
            case 'loading': return 'Initializing...';
            default: return 'Checking Connection';
        }
    };

    const lastSyncTime = state.lastSuccessfulConnection
        ? new Date(state.lastSuccessfulConnection).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Never';

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => state.status === 'connected' && setIsVisible(false)}
        >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 flex items-center gap-4 min-w-[240px]">
                <div className={`p-2 rounded-full ${state.status === 'connected' ? 'bg-emerald-50 dark:bg-emerald-900/20' : state.status === 'offline' ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                    {getStatusIcon()}
                </div>

                <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                        {getStatusText()}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        <Clock size={10} />
                        <span>Last sync: {lastSyncTime}</span>
                    </div>
                </div>

                {state.status === 'offline' && (
                    <button
                        onClick={() => connectionManager.triggerBackgroundReconnection()}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-500"
                        title="Retry Connection"
                    >
                        <RefreshCw size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};
