import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { key: string; label: string; icon: React.ReactNode }[];
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange, tabs }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your store's brain and body.</p>
        </div>
      </div>
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === t.key ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <span className="flex items-center gap-2">{t.icon} {t.label}</span>
            {activeTab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
};
