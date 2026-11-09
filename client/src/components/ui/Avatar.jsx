import React from 'react';
import { getAvatarInitials, getAvatarColor } from '../../utils/helpers';

export default function Avatar({ name, avatar, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  const color = getAvatarColor(name);

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-slate-800 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${color} rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white dark:ring-slate-800 ${className}`}
      title={name}
    >
      {getAvatarInitials(name)}
    </div>
  );
}
