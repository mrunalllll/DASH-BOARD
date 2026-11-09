import React, { useState, useEffect } from 'react';
import { ExternalLink, X, Plus } from 'lucide-react';
import { tasksAPI } from '../services/api';
import Avatar from './ui/Avatar';
import toast from 'react-hot-toast';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

export default function TaskForm({ task, projectId, columnId, members, columns, onSave, onCancel, onNavigateToDetail }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    column_id: columnId || '',
    start_date: '',
    due_date: '',
    labels: [],
  });
  const [labelInput, setLabelInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        assigned_to: task.assigned_to || '',
        priority: task.priority || 'medium',
        column_id: task.column_id || columnId || '',
        start_date: task.start_date || '',
        due_date: task.due_date || '',
        labels: task.labels || [],
      });
    } else if (columnId) {
      setForm(p => ({ ...p, column_id: columnId }));
    }
  }, [task, columnId]);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const addLabel = () => {
    const l = labelInput.trim().toLowerCase();
    if (l && !form.labels.includes(l)) {
      set('labels', [...form.labels, l]);
    }
    setLabelInput('');
  };

  const removeLabel = (l) => set('labels', form.labels.filter(x => x !== l));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        project_id: projectId,
        assigned_to: form.assigned_to || null,
        column_id: form.column_id,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
      };

      let savedTask;
      if (task) {
        const res = await tasksAPI.update(task.id, payload);
        savedTask = res.data.task;
        toast.success('Task updated!');
      } else {
        const res = await tasksAPI.create(payload);
        savedTask = res.data.task;
        toast.success('Task created!');
      }
      onSave(savedTask, !task);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Title */}
      <div>
        <label className="label">Title *</label>
        <input
          className={`input ${errors.title ? 'border-red-400' : ''}`}
          placeholder="Task title..."
          value={form.title}
          onChange={e => set('title', e.target.value)}
          autoFocus
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[80px] resize-none"
          placeholder="Optional task description..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Assign To */}
        <div>
          <label className="label">Assign To</label>
          <select
            className="input"
            value={form.assigned_to || ''}
            onChange={e => set('assigned_to', e.target.value ? parseInt(e.target.value) : '')}
          >
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="label">Priority</label>
          <select
            className="input"
            value={form.priority}
            onChange={e => set('priority', e.target.value)}
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </div>

        {/* Column */}
        {columns?.length > 0 && (
          <div>
            <label className="label">Column</label>
            <select
              className="input"
              value={form.column_id || ''}
              onChange={e => set('column_id', parseInt(e.target.value))}
            >
              {columns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Due Date */}
        <div>
          <label className="label">Due Date</label>
          <input
            type="date"
            className="input"
            value={form.due_date || ''}
            onChange={e => set('due_date', e.target.value)}
          />
        </div>
      </div>

      {/* Labels */}
      <div>
        <label className="label">Labels</label>
        <div className="flex gap-2 flex-wrap mb-2">
          {form.labels.map(l => (
            <span key={l} className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full text-xs">
              {l}
              <button type="button" onClick={() => removeLabel(l)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input text-sm"
            placeholder="Add label..."
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
          />
          <button type="button" onClick={addLabel} className="btn-secondary btn-sm flex-shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
        <div>
          {task && onNavigateToDetail && (
            <button
              type="button"
              onClick={() => onNavigateToDetail(task.id)}
              className="btn-ghost btn-sm text-primary-500"
            >
              <ExternalLink className="w-4 h-4" /> Full details
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>
    </form>
  );
}
