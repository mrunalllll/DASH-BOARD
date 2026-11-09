import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns';

export const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
};

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
};

export const isOverdue = (dateStr, status) => {
  if (!dateStr || status === 'done') return false;
  try {
    return isAfter(new Date(), parseISO(dateStr));
  } catch {
    return false;
  }
};

export const getPriorityConfig = (priority) => {
  const configs = {
    low: { label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  };
  return configs[priority] || configs.medium;
};

export const getStatusConfig = (status) => {
  const configs = {
    todo: { label: 'To Do', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    in_review: { label: 'In Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    done: { label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  };
  return configs[status] || configs.todo;
};

export const getAvatarInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarColor = (name) => {
  const colors = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500',
    'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500',
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const PROJECT_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#10B981', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6B7280', '#1E293B',
];

export const getActivityIcon = (action) => {
  const icons = {
    created_task: '✨',
    updated_task: '✏️',
    deleted_task: '🗑️',
    assigned_task: '👤',
    status_change: '🔄',
    moved_task: '📋',
    added_comment: '💬',
    completed_task: '✅',
    created_project: '🚀',
    updated_project: '📝',
    added_member: '👥',
    removed_member: '👋',
  };
  return icons[action] || '📌';
};
