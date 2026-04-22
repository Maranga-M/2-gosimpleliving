
import React, { useState, useEffect } from 'react';
import { TrendingUp, MousePointer2, Globe, Calendar, RefreshCw, Filter, ArrowUpRight, ArrowDownRight, Package, Search } from 'lucide-react';
import { AnalyticsEvent } from '../../types';
import { dbService } from '../../services/database';
import { Button } from '../Button';
import toast from 'react-hot-toast';

export const AdminAnalytics: React.FC = () => {
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const data = await dbService.getAnalyticsEvents(2000);
            setEvents(data);
        } catch (e) {
            toast.error("Failed to fetch analytics data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // Helper: Filter by time range
    const filteredEvents = events.filter(event => {
        if (timeRange === 'all') return true;
        const eventDate = new Date(event.timestamp);
        const now = new Date();
        const diffHours = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
        
        if (timeRange === '24h') return diffHours <= 24;
        if (timeRange === '7d') return diffHours <= 24 * 7;
        if (timeRange === '30d') return diffHours <= 24 * 30;
        return true;
    });

    const clicks = filteredEvents.filter(e => e.event_type === 'click');
    const views = filteredEvents.filter(e => e.event_type === 'page_view');

    // Aggregate Data
    const topProducts = Object.values(clicks.reduce((acc: any, curr) => {
        const id = curr.product_id || 'unknown';
        if (!acc[id]) acc[id] = { id, title: curr.product_title || 'Unknown Product', count: 0, revenue: 0 };
        acc[id].count++;
        acc[id].revenue += curr.product_price || 0;
        return acc;
    }, {})).sort((a: any, b: any) => b.count - a.count).slice(0, 5);

    const trafficSources = Object.entries(filteredEvents.reduce((acc: any, curr) => {
        const source = curr.source || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

    const getDailyStats = () => {
        const days: any = {};
        filteredEvents.forEach(e => {
            const day = new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!days[day]) days[day] = { day, clicks: 0, views: 0 };
            if (e.event_type === 'click') days[day].clicks++;
            else days[day].views++;
        });
        return Object.values(days).reverse().slice(0, 7).reverse();
    };

    const dailyStats = getDailyStats();
    const maxVal = Math.max(...dailyStats.map((s: any) => Math.max(s.clicks, s.views)), 1);

    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Overview</h2>
                    <p className="text-sm text-slate-500">Track performance and traffic sources.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {(['24h', '7d', '30d', 'all'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === range ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <Button onClick={fetchAnalytics} variant="outline" size="sm" className="gap-2">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><MousePointer2 size={20} /></div>
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                            <ArrowUpRight size={12} /> 12%
                        </span>
                    </div>
                    <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Product Clicks</h4>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{clicks.length.toLocaleString()}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl"><Globe size={20} /></div>
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                            <ArrowUpRight size={12} /> 5%
                        </span>
                    </div>
                    <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Unique Page Views</h4>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{views.length.toLocaleString()}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl"><TrendingUp size={20} /></div>
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                            <ArrowDownRight size={12} /> 2%
                        </span>
                    </div>
                    <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Est. Affiliate Revenue</h4>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">${(clicks.reduce((a, b) => a + (b.product_price || 0), 0) * 0.04).toFixed(2)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Traffic Activity Chart (CSS Based) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Calendar size={18} className="text-amber-500" /> Recent Activity
                    </h3>
                    <div className="flex items-end justify-between h-48 gap-2 px-2">
                        {dailyStats.map((stat: any, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex gap-1 items-end justify-center h-32">
                                    <div 
                                        className="w-2 bg-blue-500 rounded-t-sm transition-all duration-500" 
                                        style={{ height: `${(stat.views / maxVal) * 100}%` }}
                                        title={`Views: ${stat.views}`}
                                    />
                                    <div 
                                        className="w-2 bg-amber-500 rounded-t-sm transition-all duration-500" 
                                        style={{ height: `${(stat.clicks / maxVal) * 100}%` }}
                                        title={`Clicks: ${stat.clicks}`}
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap rotate-45 sm:rotate-0">{stat.day}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                            <span className="text-xs text-slate-500">Page Views</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500 rounded-full" />
                            <span className="text-xs text-slate-500">Product Clicks</span>
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Package size={18} className="text-blue-500" /> Top Performing Products
                    </h3>
                    <div className="space-y-4">
                        {topProducts.map((p: any, idx) => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">
                                        #{idx + 1}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-1 max-w-[200px]">{p.title}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{p.count} Clicks</div>
                                    <div className="text-[10px] text-slate-500">Vol: ${p.revenue.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <div className="py-12 text-center text-slate-400 text-sm">No click data yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Traffic Sources Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Filter size={18} className="text-purple-500" /> Traffic Sources
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4 text-right">Events</th>
                                <th className="px-6 py-4 text-right">Percentage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {trafficSources.map(([source, count]: any) => (
                                <tr key={source} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{source}</td>
                                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-bold">{count}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="text-xs text-slate-500">{Math.round((count / filteredEvents.length) * 100)}%</span>
                                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500" style={{ width: `${(count / filteredEvents.length) * 100}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {trafficSources.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">No source data yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
