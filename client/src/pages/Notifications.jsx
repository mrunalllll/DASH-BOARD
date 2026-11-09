import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, CheckSquare, FolderKanban, MessageSquare, AlertCircle, UserPlus } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

const NOTIF_ICONS = {
  task_assigned: { icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  comment: { icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20' },
  deadline: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/20' },
  status_change: { icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/20' },
  project_invite: { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/20' },
  info: { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' },
};
function CheckCircle({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}

export default function Notifications() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.notifications || []);
      outletCtx?.setUnreadCount(res.data.unreadCount || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      const newUnread = notifications.filter(n => !n.is_read && n.id !== id).length;
      outletCtx?.setUnreadCount(newUnread);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(p => p.map(n => ({ ...n, is_read: 1 })));
      outletCtx?.setUnreadCount(0);
      toast.success('All marked as read');
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(p => p.filter(n => n.id !== id));
    } catch {}
  };

  const handleClick = (notif) => {
    if (!notif.is_read) markRead(notif.id);
    if (notif.related_task_id) navigate(`/tasks/${notif.related_task_id}`);
    else if (notif.related_project_id) navigate(`/projects/${notif.related_project_id}`);
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-slate-500 text-sm">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary btn-sm flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: `All (${notifications.length})` },
          { value: 'unread', label: `Unread (${unreadCount})` },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description={filter === 'unread' ? "You're all caught up!" : "Notifications will appear here when there's activity in your projects"}
        />
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((notif, idx) => {
            const typeConfig = NOTIF_ICONS[notif.type] || NOTIF_ICONS.info;
            const Icon = typeConfig.icon;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                  !notif.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                } ${idx > 0 ? 'border-t border-slate-100 dark:border-slate-700/50' : ''}`}
                onClick={() => handleClick(notif)}
              >
                <div className={`w-9 h-9 rounded-xl ${typeConfig.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-4.5 h-4.5 ${typeConfig.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${!notif.is_read ? 'font-medium text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                    {notif.message}
                  </p>
                  {(notif.project_name || notif.task_title) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {notif.project_name && <span>{notif.project_name}</span>}
                      {notif.task_title && <span> · {notif.task_title}</span>}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(notif.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
