import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Search, Users, CheckSquare, Clock, MoreVertical, Archive, Trash2 } from 'lucide-react';
import { projectsAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data.projects || []);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await projectsAPI.delete(deleteId);
      setProjects(p => p.filter(pr => pr.id !== deleteId));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleArchive = async (id) => {
    try {
      await projectsAPI.update(id, { status: 'archived' });
      setProjects(p => p.map(pr => pr.id === id ? { ...pr, status: 'archived' } : pr));
      toast.success('Project archived');
      setOpenMenu(null);
    } catch {
      toast.error('Failed to archive project');
    }
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
  ];

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Projects</h1>
          <p className="text-slate-500 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => navigate('/projects/new')} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={search ? 'No projects found' : 'No projects yet'}
          description={search ? 'Try a different search term' : 'Create your first project to get started with TaskFlow'}
          action={!search && (
            <button onClick={() => navigate('/projects/new')} className="btn-primary">
              <Plus className="w-4 h-4" /> Create Project
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(project => (
            <div key={project.id} className="card-hover group relative overflow-hidden">
              {/* Color accent */}
              <div className="h-1.5 rounded-t-xl absolute top-0 left-0 right-0" style={{ background: project.color }} />

              <div className="p-5 pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold" style={{ background: project.color }}>
                      {project.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{project.name}</h3>
                      <p className="text-xs text-slate-400">by {project.owner_name}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.preventDefault(); setOpenMenu(openMenu === project.id ? null : project.id); }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === project.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 py-1 w-40">
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          onClick={() => { navigate(`/projects/${project.id}/edit`); setOpenMenu(null); }}
                        >
                          Edit
                        </button>
                        {project.status !== 'archived' && (
                          <button
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            onClick={() => handleArchive(project.id)}
                          >
                            <Archive className="w-4 h-4" /> Archive
                          </button>
                        )}
                        {project.owner_id === user?.id && (
                          <button
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => { setDeleteId(project.id); setOpenMenu(null); }}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                  {project.description || 'No description provided.'}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress</span>
                    <span>{project.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${project.completion_percentage}%`,
                        background: `linear-gradient(to right, ${project.color}cc, ${project.color})`
                      }}
                    />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project.member_count}</span>
                    <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{project.completed_tasks}/{project.total_tasks}</span>
                  </div>
                  {project.due_date && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(project.due_date)}</span>
                  )}
                </div>
              </div>

              <Link to={`/projects/${project.id}`} className="absolute inset-0" />
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? All boards, tasks, and comments will be permanently removed."
        confirmLabel="Delete Project"
      />
    </div>
  );
}
