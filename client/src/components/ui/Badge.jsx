import React from 'react';
import { getPriorityConfig, getStatusConfig } from '../../utils/helpers';

export function PriorityBadge({ priority }) {
  const config = getPriorityConfig(priority);
  return (
    <span className={`badge ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1`} />
      {config.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  return (
    <span className={`badge ${config.color}`}>
      {config.label}
    </span>
  );
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return (
    <span className={`badge ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}
