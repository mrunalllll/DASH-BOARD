import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/ui/Avatar';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'My Projects', icon: FolderKanban },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, unreadCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-slate-800 dark:text-white">TaskFlow</span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
            title={collapsed ? label : undefined}
          >
            <div className="relative">
              <Icon className="w-5 h-5 flex-shrink-0" />
              {to === '/notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className={`border-t border-slate-200 dark:border-slate-700 p-3 ${collapsed ? 'items-center' : ''}`}>
        {!collapsed && (
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors mb-1"
            onClick={() => navigate('/profile')}
          >
            <Avatar name={user?.name} avatar={user?.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 ${collapsed ? 'justify-center' : ''}`}
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}>
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="absolute top-20 -right-3 w-6 h-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center shadow-sm hover:shadow text-slate-500 hover:text-slate-700 transition-all z-10"
          style={{ position: 'absolute' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-white dark:bg-slate-800 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
