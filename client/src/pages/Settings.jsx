import React from 'react';
import { Sun, Moon, Bell, Shield, Palette, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-500" /> Appearance
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
                <p className="text-sm text-slate-500">Switch between light and dark theme</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-500" /> Notifications
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Task assignments', desc: 'When a task is assigned to you' },
            { label: 'Task comments', desc: 'When someone comments on your task' },
            { label: 'Deadline reminders', desc: 'When a task deadline is approaching' },
            { label: 'Project invitations', desc: 'When you are added to a project' },
            { label: 'Status updates', desc: 'When task status changes' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" /> Security
        </h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">JWT Authentication Active</p>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500">Your session is secured with JWT tokens (7-day expiry)</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Password Encryption</p>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-500">Passwords are hashed using bcrypt with salt rounds</p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-500" /> About TaskFlow
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Frontend', value: 'React + Vite + Tailwind' },
            { label: 'Backend', value: 'Node.js + Express' },
            { label: 'Database', value: 'SQLite (node:sqlite)' },
            { label: 'Auth', value: 'JWT + bcrypt' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-slate-400 text-xs">{label}</p>
              <p className="font-medium text-slate-700 dark:text-slate-200">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
