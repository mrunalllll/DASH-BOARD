import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Edit3, Trash2, Calendar, User,
  Tag, MessageSquare, Clock, CheckCircle, AlertCircle,
  Pencil, X, Check
} from 'lucide-react';
import { tasksAPI, commentsAPI, projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, formatRelativeTime, isOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [members, setMembers] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const commentsEndRef = useRef(null);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        tasksAPI.get(id),
        tasksAPI.getComments(id),
      ]);
      const t = taskRes.data.task;
      setTask(t);
      setComments(commentsRes.data.comments || []);
      setEditForm({
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        assigned_to: t.assigned_to || '',
        due_date: t.due_date || '',
      });
      // Load project members and columns
      const [membersRes, boardRes] = await Promise.all([
        projectsAPI.getMembers(t.project_id),
        projectsAPI.getBoard(t.project_id),
      ]);
      setMembers(membersRes.data.members || []);
      setColumns(boardRes.data.columns || []);
    } catch {
      toast.error('Task not found');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await tasksAPI.addComment(id, { content: comment.trim() });
      setComments(p => [...p, res.data.comment]);
      setComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      const res = await commentsAPI.update(commentId, { content: editContent.trim() });
      setComments(p => p.map(c => c.id === commentId ? res.data.comment : c));
      setEditingComment(null);
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async () => {
    try {
      await commentsAPI.delete(deleteCommentId);
      setComments(p => p.filter(c => c.id !== deleteCommentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleSaveTask = async () => {
    try {
      const colId = task.column_id;
      const selectedCol = columns.find(c =>
        (editForm.status === 'todo' && c.name.toLowerCase().includes('to do')) ||
        (editForm.status === 'in_progress' && c.name.toLowerCase().includes('progress')) ||
        (editForm.status === 'in_review' && c.name.toLowerCase().includes('review')) ||
        (editForm.status === 'done' && c.name.toLowerCase().includes('done'))
      );
      const res = await tasksAPI.update(id, {
        ...editForm,
        assigned_to: editForm.assigned_to || null,
        column_id: selectedCol?.id || colId,
      });
      setTask(res.data.task);
      setIsEditing(false);
      toast.success('Task updated!');
    } catch {
      toast.error('Failed to update task');
    }
  };

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;
  if (!task) return null;

  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <Link to={`/projects/${task.project_id}/board`} className="btn-secondary btn-sm">View Board</Link>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary btn-sm">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="btn-secondary btn-sm">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSaveTask} className="btn-primary btn-sm">
                <Check className="w-4 h-4" /> Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: task.project_color }} />
              <span>{task.project_name}</span>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">{task.column_name}</span>
            </div>

            {isEditing ? (
              <input
                className="input text-xl font-bold mb-3"
                value={editForm.title}
                onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
              />
            ) : (
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">{task.title}</h1>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {overdue && <span className="badge bg-red-100 text-red-600"><AlertCircle className="w-3 h-3 mr-1" />Overdue</span>}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Description</h3>
              {isEditing ? (
                <textarea
                  className="input min-h-[120px] resize-none"
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {task.description || <span className="text-slate-400 italic">No description provided.</span>}
                </p>
              )}
            </div>

            {/* Labels */}
            {task.labels?.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map(l => (
                    <span key={l} className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-500" />
              Comments ({comments.length})
            </h2>

            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {comments.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No comments yet. Be the first!</p>
              ) : comments.map(c => (
                <div key={c.id} className="flex items-start gap-3 group">
                  <Avatar name={c.author_name} avatar={c.author_avatar} size="sm" className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.author_name}</span>
                      <span className="text-xs text-slate-400">{formatRelativeTime(c.created_at)}</span>
                      {c.created_at !== c.updated_at && <span className="text-xs text-slate-300">(edited)</span>}
                    </div>
                    {editingComment === c.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="input min-h-[80px] resize-none text-sm"
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateComment(c.id)} className="btn-primary btn-sm">Save</button>
                          <button onClick={() => setEditingComment(null)} className="btn-secondary btn-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    )}
                  </div>
                  {c.user_id === user?.id && editingComment !== c.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingComment(c.id); setEditContent(c.content); }}
                        className="p-1 text-slate-400 hover:text-primary-500 rounded"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCommentId(c.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            <form onSubmit={handleCommentSubmit} className="flex gap-3 items-start">
              <Avatar name={user?.name} avatar={user?.avatar} size="sm" className="flex-shrink-0 mt-1" />
              <div className="flex-1">
                <textarea
                  className="input text-sm resize-none min-h-[70px]"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleCommentSubmit(e); }}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-400">Ctrl+Enter to submit</span>
                  <button type="submit" disabled={!comment.trim() || submitting} className="btn-primary btn-sm">
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Sending...' : 'Comment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Details</h3>

            {/* Assignee */}
            <div>
              <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1"><User className="w-3 h-3" />Assignee</p>
              {isEditing ? (
                <select
                  className="input text-sm"
                  value={editForm.assigned_to || ''}
                  onChange={e => setEditForm(p => ({ ...p, assigned_to: e.target.value || null }))}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              ) : task.assignee_name ? (
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignee_name} avatar={task.assignee_avatar} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{task.assignee_name}</p>
                    <p className="text-xs text-slate-400">@{task.assignee_username}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Unassigned</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Priority</p>
              {isEditing ? (
                <select className="input text-sm" value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value }))}>
                  {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              ) : <PriorityBadge priority={task.priority} />}
            </div>

            {/* Status */}
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Status</p>
              {isEditing ? (
                <select className="input text-sm" value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                  {['todo', 'in_progress', 'in_review', 'done'].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              ) : <StatusBadge status={task.status} />}
            </div>

            {/* Due Date */}
            <div>
              <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" />Due Date</p>
              {isEditing ? (
                <input type="date" className="input text-sm" value={editForm.due_date || ''} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} />
              ) : task.due_date ? (
                <p className={`text-sm font-medium ${overdue ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {overdue && '⚠️ '}{formatDate(task.due_date)}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">Not set</p>
              )}
            </div>

            {/* Creator */}
            <div>
              <p className="text-xs text-slate-400 mb-1">Created by</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{task.creator_name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-1">Created</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{formatRelativeTime(task.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteCommentId}
        onClose={() => setDeleteCommentId(null)}
        onConfirm={handleDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmLabel="Delete"
      />
    </div>
  );
}
