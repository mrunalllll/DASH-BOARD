import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { notificationsAPI } from '../services/api';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationsAPI.getAll();
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        unreadCount={unreadCount}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          onMenuClick={() => setMobileOpen(p => !p)}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet context={{ setUnreadCount }} />
        </main>
      </div>
    </div>
  );
}
