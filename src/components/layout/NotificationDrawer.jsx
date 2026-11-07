import React from 'react';
import { useIncidents } from '../../context/IncidentContext';
import { X, CheckCheck, Bell, AlertTriangle, Scale, Clock, FileText } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, onSelectIncident }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useIncidents();

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'appeal':
        return <Scale className="w-4 h-4 text-purple-500" />;
      case 'service':
        return <Clock className="w-4 h-4 text-teal-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Notifications</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (notif.link && onSelectIncident) {
                      onSelectIncident(notif.link);
                      onClose();
                    }
                  }}
                  className={`p-4 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    !notif.is_read ? 'bg-teal-50/40 dark:bg-slate-800/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold truncate ${!notif.is_read ? 'text-teal-900 dark:text-teal-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-2 block">
                        {new Date(notif.timestamp).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No active notifications at this time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
