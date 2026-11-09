import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FolderKanban, CheckSquare, Search } from 'lucide-react';
import { projectsAPI, tasksAPI } from '../services/api';
import Avatar from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Team() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [teamMap, setTeamMap] = useState({});
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const res = await projectsAPI.getAll();
      const projs = res.data.projects || [];
      setProjects(projs);

      const membersByProject = {};
      const memberSet = {};

      await Promise.all(projs.map(async (p) => {
        const membersRes = await projectsAPI.getMembers(p.id);
        const members = membersRes.data.members || [];
        membersByProject[p.id] = { project: p, members };
        members.forEach(m => {
          if (!memberSet[m.id]) memberSet[m.id] = { ...m, projects: [] };
          memberSet[m.id].projects.push({ id: p.id, name: p.name, color: p.color, role: m.role });
        });
      }));

      setTeamMap(membersByProject);
      setAllMembers(Object.values(memberSet));
    } catch {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const displayMembers = allMembers.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.username?.toLowerCase().includes(search.toLowerCase());
    const matchProject = selectedProject === 'all' ||
      m.projects.some(p => p.id === parseInt(selectedProject));
    return matchSearch && matchProject;
  });

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Team</h1>
        <p className="text-slate-500 text-sm">{allMembers.length} team members across {projects.length} projects</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-10" placeholder="Search team members..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="input w-auto"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {displayMembers.length === 0 ? (
        <EmptyState icon={Users} title="No team members found" description="Try a different filter or search term" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayMembers.map(member => (
            <div key={member.id} className="card p-5">
              <div className="flex items-start gap-4 mb-4">
                <Avatar name={member.name} avatar={member.avatar} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{member.name}</h3>
                  <p className="text-sm text-slate-400">@{member.username}</p>
                  <p className="text-xs text-slate-400 truncate">{member.email}</p>
                  {member.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{member.bio}</p>}
                </div>
              </div>

              {member.projects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" /> Projects
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.projects.slice(0, 3).map(p => (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{p.name}</span>
                        <span className={`ml-1 capitalize ${p.role === 'admin' ? 'text-primary-500' : 'text-slate-400'}`}>
                          ({p.role})
                        </span>
                      </button>
                    ))}
                    {member.projects.length > 3 && (
                      <span className="text-xs text-slate-400">+{member.projects.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
