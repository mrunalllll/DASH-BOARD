import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import { projectsAPI } from '../services/api';
import { PROJECT_COLORS } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function CreateProject() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    due_date: '',
    visibility: 'private',
    color: '#6366F1',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      projectsAPI.get(id).then(res => {
        const p = res.data.project;
        setForm({
          name: p.name,
          description: p.description || '',
          start_date: p.start_date || '',
          due_date: p.due_date || '',
          visibility: p.visibility,
          color: p.color,
        });
      }).catch(() => toast.error('Failed to load project'));
    }
  }, [id, isEdit]);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (form.due_date && form.start_date && form.due_date < form.start_date) {
      e.due_date = 'Due date must be after start date';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await projectsAPI.update(id, form);
        toast.success('Project updated!');
        navigate(`/projects/${id}`);
      } else {
        const res = await projectsAPI.create(form);
        toast.success('Project created!');
        navigate(`/projects/${res.data.project.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="card">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: form.color }}>
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isEdit ? 'Edit Project' : 'Create New Project'}
              </h1>
              <p className="text-slate-500 text-sm">Fill in the project details below</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="label">Project Name *</label>
            <input
              className={`input ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="e.g., E-Commerce Platform"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Brief description of this project..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                className="input"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
              />
              {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date}</p>}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="label">Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'private', label: 'Private', desc: 'Only invited members' },
                { value: 'public', label: 'Public', desc: 'Anyone can view' },
              ].map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => set('visibility', v.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.visibility === v.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{v.label}</p>
                  <p className="text-xs text-slate-400">{v.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="label">Project Color</label>
            <div className="flex flex-wrap gap-3">
              {PROJECT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set('color', color)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              ) : isEdit ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
