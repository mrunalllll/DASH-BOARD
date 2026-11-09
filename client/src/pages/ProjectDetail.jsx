import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Settings, Users, LayoutGrid, Activity,
  Plus, UserPlus, Trash2, Edit3, UserMinus, Shield
} from 'lucide-react';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, formatRelativeTime, getActivityIcon } from '../utils/helpers';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Members', 'Activity'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);
  const [removeId, setRemoveId] = useState(null);

  const isOwner = project?.owner_id === user?.id;
  const myRole = members.find(m => m.id === user?.id)?.role;
  const isAdmin = isOwner || myRole === 'admin';

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [projRes, membersRes, activityRes] = await Promise.all([
        projectsAPI.get(id),
        projectsAPI.getMembers(id),
        projectsAPI.getActivity(id),
      ]);
      setProject(projRes.data.project);
      setMembers(membersRes.data.members || []);
      setActivity(activityRes.data.activities || []);
    } catch {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setAddingMember(true);
    try {
      const res = await projectsAPI.addMember(id, { email: memberEmail.trim(), role: memberRole });
      setMembers(p => [...p, res.data.member]);
      setMemberEmail('');
      setShowAddMember(false);
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    try {
      await projectsAPI.removeMember(id, removeId);
      setMembers(p => p.filter(m => m.id !== removeId));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await projectsAPI.updateMemberRole(id, userId, role);
      setMembers(p => p.map(m => m.id === userId ? { ...m, role } : m));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;
  if (!project) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: project.color }}>
              {project.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{project.name}</h1>
              <p className="text-slate-500 text-sm">{project.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/projects/${id}/board`} className="btn-primary">
            <LayoutGrid className="w-4 h-4" /> Open Board
          </Link>
          {isAdmin && (
            <button onClick={() => navigate(`/projects/${id}/edit`)} className="btn-secondary">
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress banner */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-6 mb-4">
          {[
            { label: 'Status', value: project.status },
            { label: 'Members', value: `${project.member_count} people` },
            { label: 'Tasks', value: `${project.completed_tasks}/${project.total_tasks} done` },
            { label: 'Due', value: project.due_date ? formatDate(project.due_date) : 'No deadline' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all"
              style={{ width: `${project.completion_percentage}%`, background: `linear-gradient(to right, ${project.color}bb, ${project.color})` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{project.completion_percentage}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Project Details</h3>
            <dl className="space-y-3">
              {[
                { label: 'Owner', value: project.owner_name },
                { label: 'Start Date', value: project.start_date ? formatDate(project.start_date) : 'Not set' },
                { label: 'Due Date', value: project.due_date ? formatDate(project.due_date) : 'Not set' },
                { label: 'Visibility', value: project.visibility, className: 'capitalize' },
                { label: 'Created', value: formatDate(project.created_at) },
              ].map(({ label, value, className }) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className={`text-sm font-medium text-slate-700 dark:text-slate-200 ${className || ''}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Team</h3>
            <div className="space-y-3">
              {members.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar name={m.name} avatar={m.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{m.role}</p>
                  </div>
                </div>
              ))}
              {members.length > 5 && <p className="text-sm text-slate-400">+{members.length - 5} more</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'Members' && (
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{members.length} Members</h3>
            {isAdmin && (
              <button onClick={() => setShowAddMember(true)} className="btn-primary btn-sm">
                <UserPlus className="w-4 h-4" /> Add Member
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                <Avatar name={m.name} avatar={m.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-700 dark:text-slate-200">{m.name}</p>
                    {m.id === project.owner_id && (
                      <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">Owner</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">@{m.username} · {m.email}</p>
                </div>
                {isAdmin && m.id !== project.owner_id && (
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                      className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => setRemoveId(m.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Activity' && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Project Activity</h3>
          {activity.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {activity.map(a => (
                <div key={a.id} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                    {getActivityIcon(a.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar name={a.user_name} avatar={a.user_avatar} size="xs" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{a.user_name}</span>
                      <span className="text-sm text-slate-500">{a.details}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddMember} className="p-6 space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="member@example.com"
              value={memberEmail}
              onChange={e => setMemberEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              value={memberRole}
              onChange={e => setMemberRole(e.target.value)}
              className="input"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowAddMember(false)}>Cancel</button>
            <button type="submit" disabled={addingMember} className="btn-primary flex-1">
              {addingMember ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message="Are you sure you want to remove this member from the project?"
        confirmLabel="Remove"
      />
    </div>
  );
}
