import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, MoreVertical, X, MessageSquare,
  Calendar, Pencil, Trash2, GripVertical, AlertCircle
} from 'lucide-react';
import {
  DndContext, closestCorners, DragOverlay,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { projectsAPI, tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import { PriorityBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, isOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';
import TaskForm from '../components/TaskForm';

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSorting } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSorting ? 0.4 : 1,
  };
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 p-3 cursor-pointer hover:shadow-md transition-all group ${isDragging ? 'shadow-2xl rotate-2' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 text-slate-300 cursor-grab active:cursor-grabbing transition-opacity"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map(l => (
            <span key={l} className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-medium">
              {l}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-medium text-slate-700 dark:text-slate-100 leading-snug mb-2 pr-4 cursor-pointer"
        onClick={() => onEdit(task)}>
        {task.title}
      </p>

      {task.description && (
        <p className="text-xs text-slate-400 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.comment_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <MessageSquare className="w-3 h-3" />{task.comment_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className={`text-[11px] flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
              {overdue && <AlertCircle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              {formatDate(task.due_date)}
            </span>
          )}
          {task.assignee_name && (
            <Avatar name={task.assignee_name} avatar={task.assignee_avatar} size="xs" />
          )}
        </div>
      </div>

      {/* Edit/Delete */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="p-1 rounded text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Column ────────────────────────────────────────────────────────────────────
function Column({ column, tasks, members, projectId, onAddTask, onEditTask, onDeleteTask, onEditColumn, onDeleteColumn }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(column.name);

  const handleRename = async () => {
    if (!newName.trim() || newName === column.name) { setIsEditing(false); return; }
    try {
      await projectsAPI.updateColumn(projectId, column.id, { name: newName });
      onEditColumn(column.id, newName);
      setIsEditing(false);
    } catch {
      toast.error('Failed to rename column');
      setIsEditing(false);
    }
  };

  const colColors = {
    'To Do': 'bg-slate-500',
    'In Progress': 'bg-blue-500',
    'In Review': 'bg-purple-500',
    'Done': 'bg-green-500',
  };
  const dotColor = colColors[column.name] || 'bg-primary-500';

  return (
    <div className="flex-shrink-0 w-72 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
          {isEditing ? (
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
              className="text-sm font-semibold bg-transparent border-b border-primary-500 outline-none text-slate-700 dark:text-slate-200 flex-1"
            />
          ) : (
            <h3
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:text-primary-500 truncate"
              onDoubleClick={() => setIsEditing(true)}
            >
              {column.name}
            </h3>
          )}
          <span className="bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
            {tasks.length}
          </span>
        </div>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(p => !p)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-36">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={() => { setIsEditing(true); setShowMenu(false); }}
              >
                <Pencil className="w-4 h-4" /> Rename
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => { onDeleteColumn(column.id); setShowMenu(false); }}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto space-y-2 kanban-column min-h-[100px] rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <div key={task.id} className="relative">
              <TaskCard
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            </div>
          ))}
        </SortableContext>
      </div>

      {/* Add Task */}
      <button
        onClick={() => onAddTask(column.id)}
        className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-primary-500 hover:bg-white dark:hover:bg-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-300 transition-all text-sm"
      >
        <Plus className="w-4 h-4" /> Add task
      </button>
    </div>
  );
}

// ─── Main Board ────────────────────────────────────────────────────────────────
export default function KanbanBoard() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasksByColumn, setTasksByColumn] = useState({});
  const [members, setMembers] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [taskModal, setTaskModal] = useState({ open: false, task: null, columnId: null });
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [deleteColId, setDeleteColId] = useState(null);
  const [addColMode, setAddColMode] = useState(false);
  const [newColName, setNewColName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    loadBoard();
  }, [projectId]);

  const loadBoard = async () => {
    try {
      const [boardRes, projectRes, membersRes] = await Promise.all([
        projectsAPI.getBoard(projectId),
        projectsAPI.get(projectId),
        projectsAPI.getMembers(projectId),
      ]);
      setBoard(boardRes.data.board);
      setColumns(boardRes.data.columns || []);
      setTasksByColumn(boardRes.data.tasksByColumn || {});
      setProject(projectRes.data.project);
      setMembers(membersRes.data.members || []);
    } catch {
      toast.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const findColumnOfTask = useCallback((taskId) => {
    for (const [colId, tasks] of Object.entries(tasksByColumn)) {
      if (tasks.find(t => t.id === taskId)) return colId;
    }
    return null;
  }, [tasksByColumn]);

  const handleDragStart = ({ active }) => {
    const colId = findColumnOfTask(active.id);
    if (colId) {
      const task = tasksByColumn[colId]?.find(t => t.id === active.id);
      setActiveTask(task);
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeColId = findColumnOfTask(active.id);
    const overColId = tasksByColumn[over.id] ? over.id : findColumnOfTask(over.id);
    if (!activeColId || !overColId || activeColId === overColId) return;

    setTasksByColumn(prev => {
      const activeTasks = [...(prev[activeColId] || [])];
      const overTasks = [...(prev[overColId] || [])];
      const task = activeTasks.find(t => t.id === active.id);
      if (!task) return prev;
      return {
        ...prev,
        [activeColId]: activeTasks.filter(t => t.id !== active.id),
        [overColId]: [...overTasks, task],
      };
    });
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const colId = findColumnOfTask(active.id);
    if (!colId) return;

    const tasks = tasksByColumn[colId] || [];
    const oldIdx = tasks.findIndex(t => t.id === active.id);
    const newIdx = tasks.findIndex(t => t.id === over.id);

    if (oldIdx !== newIdx && newIdx !== -1) {
      const reordered = arrayMove(tasks, oldIdx, newIdx);
      setTasksByColumn(prev => ({ ...prev, [colId]: reordered }));
    }

    // Persist move
    try {
      await tasksAPI.move(active.id, { column_id: parseInt(colId), position: newIdx >= 0 ? newIdx : tasks.length });
    } catch {
      toast.error('Failed to save task position');
      loadBoard();
    }
  };

  const handleAddTask = (columnId) => {
    setTaskModal({ open: true, task: null, columnId });
  };

  const handleEditTask = (task) => {
    setTaskModal({ open: true, task, columnId: task.column_id });
  };

  const handleTaskSaved = (savedTask, isNew) => {
    setTaskModal({ open: false, task: null, columnId: null });
    if (isNew) {
      setTasksByColumn(prev => ({
        ...prev,
        [savedTask.column_id]: [...(prev[savedTask.column_id] || []), savedTask],
      }));
    } else {
      setTasksByColumn(prev => {
        const updated = { ...prev };
        for (const colId in updated) {
          updated[colId] = updated[colId].map(t => t.id === savedTask.id ? savedTask : t);
        }
        return updated;
      });
    }
  };

  const handleDeleteTask = async () => {
    try {
      await tasksAPI.delete(deleteTaskId);
      setTasksByColumn(prev => {
        const updated = { ...prev };
        for (const colId in updated) {
          updated[colId] = updated[colId].filter(t => t.id !== deleteTaskId);
        }
        return updated;
      });
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleDeleteColumn = async () => {
    try {
      await projectsAPI.deleteColumn(projectId, deleteColId);
      setColumns(p => p.filter(c => c.id !== deleteColId));
      setTasksByColumn(prev => { const u = { ...prev }; delete u[deleteColId]; return u; });
      toast.success('Column deleted');
    } catch {
      toast.error('Failed to delete column');
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      const res = await projectsAPI.createColumn(projectId, { name: newColName.trim() });
      const col = res.data.column;
      setColumns(p => [...p, col]);
      setTasksByColumn(p => ({ ...p, [col.id]: [] }));
      setNewColName('');
      setAddColMode(false);
    } catch {
      toast.error('Failed to create column');
    }
  };

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Board Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: project?.color }} />
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100">{project?.name}</h1>
              <p className="text-xs text-slate-400">Kanban Board · {columns.reduce((sum, c) => sum + (tasksByColumn[c.id]?.length || 0), 0)} tasks</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Member avatars */}
          <div className="hidden sm:flex -space-x-2">
            {members.slice(0, 4).map(m => (
              <Avatar key={m.id} name={m.name} avatar={m.avatar} size="sm" />
            ))}
            {members.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800">
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 h-full items-start">
            {columns.map(column => (
              <Column
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] || []}
                members={members}
                projectId={projectId}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={(id) => setDeleteTaskId(id)}
                onEditColumn={(id, name) => setColumns(p => p.map(c => c.id === id ? { ...c, name } : c))}
                onDeleteColumn={(id) => setDeleteColId(id)}
              />
            ))}

            {/* Add column */}
            <div className="flex-shrink-0 w-72">
              {addColMode ? (
                <form onSubmit={handleAddColumn} className="card p-3">
                  <input
                    autoFocus
                    className="input mb-2 text-sm"
                    placeholder="Column name..."
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary btn-sm flex-1">Add</button>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => setAddColMode(false)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddColMode(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-all text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Add column
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="drag-overlay bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 p-3 w-64 shadow-2xl rotate-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-100">{activeTask.title}</p>
                <PriorityBadge priority={activeTask.priority} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null, columnId: null })}
        title={taskModal.task ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <TaskForm
          task={taskModal.task}
          projectId={parseInt(projectId)}
          columnId={taskModal.columnId}
          members={members}
          columns={columns}
          onSave={handleTaskSaved}
          onCancel={() => setTaskModal({ open: false, task: null, columnId: null })}
          onNavigateToDetail={(id) => navigate(`/tasks/${id}`)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete Task"
      />
      <ConfirmDialog
        isOpen={!!deleteColId}
        onClose={() => setDeleteColId(null)}
        onConfirm={handleDeleteColumn}
        title="Delete Column"
        message="Delete this column and all its tasks? This cannot be undone."
        confirmLabel="Delete Column"
      />
    </div>
  );
}
