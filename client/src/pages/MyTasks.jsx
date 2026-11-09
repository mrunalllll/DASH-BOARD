import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Search, Filter, Calendar, AlertCircle } from 'lucide-react';
import { tasksAPI } from '../services/api';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, isOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ priority: '', status: '' });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await tasksAPI.getAll({ my_tasks: 'true' });
      setTasks(res.data.tasks || []);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.project_name?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = !filters.priority || t.priority === filters.priority;
    const matchStatus = !filters.status || t.status === filters.status;
    return matchSearch && matchPriority && matchStatus;
  });

  const grouped = {
    overdue: filtered.filter(t => isOverdue(t.due_date, t.status)),
    today: filtered.filter(t => {
      if (!t.due_date || t.status === 'done' || isOverdue(t.due_date, t.status)) return false;
      return t.due_date === new Date().toISOString().split('T')[0];
    }),
    active: filtered.filter(t => t.status !== 'done' && !isOverdue(t.due_date, t.status) && t.due_date !== new Date().toISOString().split('T')[0]),
    done: filtered.filter(t => t.status === 'done'),
  };

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;

  const TaskRow = ({ task }) => (
    <div
      className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-500'}`}>
          {task.status === 'done' && <svg viewBox="0 0 16 16" fill="white"><path d="M6 10.8L3.2 8 2.27 8.93l3.73 3.74 8-8L13.07 3.8z" /></svg>}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.project_color }} />
            <p className="text-xs text-slate-400 truncate">{task.project_name}</p>
          </div>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        {task.due_date && (
          <span className={`text-xs flex items-center gap-1 ${isOverdue(task.due_date, task.status) ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
            {isOverdue(task.due_date, task.status) && <AlertCircle className="w-3 h-3" />}
            <Calendar className="w-3 h-3" />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );

  const Section = ({ title, tasks, color = '' }) => {
    if (tasks.length === 0) return null;
    return (
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <span className={`text-sm font-semibold ${color}`}>{title}</span>
          <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">{tasks.length}</span>
        </div>
        {tasks.map(t => <TaskRow key={t.id} task={t} />)}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Tasks</h1>
        <p className="text-slate-500 text-sm">{tasks.length} tasks assigned to you</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-10" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="input w-auto"
          value={filters.priority}
          onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className="input w-auto"
          value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={search || filters.priority || filters.status ? 'Try adjusting your filters' : "You don't have any tasks assigned yet"}
        />
      ) : (
        <>
          <Section title="⚠️ Overdue" tasks={grouped.overdue} color="text-red-500" />
          <Section title="📅 Due Today" tasks={grouped.today} color="text-orange-500" />
          <Section title="📋 Active" tasks={grouped.active} />
          <Section title="✅ Completed" tasks={grouped.done} color="text-green-500" />
        </>
      )}
    </div>
  );
}
