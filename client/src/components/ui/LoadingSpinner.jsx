import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={`${sizes[size]} rounded-full border-slate-200 border-t-primary-500 animate-spin ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary-500 animate-spin" />
        <p className="text-slate-500 text-sm">Loading TaskFlow...</p>
      </div>
    </div>
  );
}
