import React, { useState } from 'react';
import { Bell, Tag, Zap, Gift } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationBellProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  notifications, 
  onMarkRead,
  onClearAll 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    // Optional: Mark all as read when opening? No, let user interact.
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'deal': return <Tag size={16} className="text-green-500" />;
      case 'recommendation': return <Gift size={16} className="text-purple-500" />;
      default: return <Zap size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleToggle}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
              {notifications.length > 0 && (
                <button 
                    onClick={onClearAll} 
                    className="text-xs text-slate-500 hover:text-slate-800"
                >
                    Clear all
                </button>
              )}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {notifications.map(n => (
                    <div 
                        key={n.id} 
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${n.read ? 'opacity-60' : 'bg-white'}`}
                        onClick={() => {
                            onMarkRead(n.id);
                            // Could navigate to product here
                        }}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 flex-shrink-0">
                            {getIcon(n.type)}
                        </div>
                        <div>
                          <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{n.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No new notifications
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};