import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, X, FolderKanban, CheckSquare, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { searchAPI } from '../services/api';
import Avatar from '../components/ui/Avatar';
import { PriorityBadge } from '../components/ui/Badge';

export default function TopBar({ onMenuClick, unreadCount }) {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults(null); return; }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchAPI.search(searchQuery);
        setSearchResults(res.data);
      } catch {}
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
        setSearchResults(null);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hasResults = searchResults && (
    searchResults.projects?.length > 0 ||
    searchResults.tasks?.length > 0 ||
    searchResults.users?.length > 0
  );

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 flex-shrink-0">
      {/* Mobile menu */}
      <button
        className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, tasks, people..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearch && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 max-h-96 overflow-y-auto">
            {searchLoading ? (
              <div className="p-4 text-center text-slate-500 text-sm">Searching...</div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-slate-500 text-sm">No results found</div>
            ) : (
              <div className="p-2">
                {searchResults.projects?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1">Projects</p>
                    {searchResults.projects.map(p => (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                        onClick={() => { navigate(`/projects/${p.id}`); setShowSearch(false); setSearchQuery(''); }}
                      >
                        <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: p.color }} />
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.tasks?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1">Tasks</p>
                    {searchResults.tasks.map(t => (
                      <button
                        key={t.id}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                        onClick={() => { navigate(`/tasks/${t.id}`); setShowSearch(false); setSearchQuery(''); }}
                      >
                        <CheckSquare className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{t.title}</p>
                          <p className="text-xs text-slate-400">{t.project_name}</p>
                        </div>
                        <PriorityBadge priority={t.priority} />
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.users?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1">People</p>
                    {searchResults.users.map(u => (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                        <Avatar name={u.name} avatar={u.avatar} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{u.name}</p>
                          <p className="text-xs text-slate-400">@{u.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          onClick={() => navigate('/profile')}
        >
          <Avatar name={user?.name} avatar={user?.avatar} size="sm" />
          <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
            {user?.name}
          </span>
        </button>
      </div>
    </header>
  );
}
