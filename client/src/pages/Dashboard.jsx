import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckSquare, Clock, AlertCircle, TrendingUp,
  Plus, ArrowRight, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, projectsAPI } from '../services/api';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, formatRelativeTime, getActivityIcon, isOverdue } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, projectsRes, tasksRes] = await Promise.all([
          tasksAPI.getDashboardStats(),
          projectsAPI.getAll(),
          tasksAPI.getAll({ my_tasks: 'true' }),
        ]);
        setStats(statsRes.data);
        setProjects(projectsRes.data.projects?.slice(0, 4) || []);
        setMyTasks(tasksRes.data.tasks?.filter(t => t.status !== 'done')?.slice(0, 5) || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;

  const statCards = [
    { label: 'Total Projects', value: stats?.stats?.totalProjects ?? 0, icon: FolderKanban, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Active Projects', value: stats?.stats?.activeProjects ?? 0, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'My Tasks', value: stats?.stats?.totalTasks ?? 0, icon: CheckSquare, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Completed', value: stats?.stats?.completedTasks ?? 0, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Pending', value: stats?.stats?.pendingTasks ?? 0, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Overdue', value: stats?.stats?.overdueTasks ?? 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  const pieData = [
    { name: 'Completed', value: stats?.stats?.completedTasks || 0, color: '#10b981' },
    { name: 'In Progress', value: Math.max(0, (stats?.stats?.pendingTasks || 0) - (stats?.stats?.overdueTasks || 0)), color: '#6366f1' },
    { name: 'Overdue', value: stats?.stats?.overdueTasks || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-primary-100 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            className="hidden sm:flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">My Projects</h2>
            <Link to="/projects" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="card p-8 text-center">
              <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No projects yet</p>
              <button onClick={() => navigate('/projects/new')} className="btn-primary btn-sm">
                <Plus className="w-4 h-4" /> Create Project
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {projects.map(project => (
                <Link key={project.id} to={`/projects/${project.id}`} className="card-hover p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: project.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{project.name}</h3>
                      <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{project.member_count} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
                          style={{ width: `${project.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{project.completion_percentage}%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{project.total_tasks} tasks</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Charts + Activity */}
        <div className="space-y-4">
          {/* Task Breakdown Pie */}
          {pieData.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Task Overview</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, name]} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Activity */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Recent Activity</h3>
            {stats?.recentActivity?.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats?.recentActivity?.slice(0, 6).map(activity => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0 mt-0.5">{getActivityIcon(activity.action)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{activity.details}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatRelativeTime(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">My Pending Tasks</h2>
          <Link to="/tasks" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {myTasks.length === 0 ? (
          <div className="card p-8 text-center">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">You're all caught up! No pending tasks.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Task', 'Project', 'Priority', 'Status', 'Due Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myTasks.map(task => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{task.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: task.project_color }} />
                          <span className="text-slate-500 truncate max-w-[120px]">{task.project_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                      <td className="px-4 py-3">
                        {task.due_date ? (
                          <span className={`text-xs ${isOverdue(task.due_date, task.status) ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                            {isOverdue(task.due_date, task.status) && '⚠️ '}
                            {formatDate(task.due_date)}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
