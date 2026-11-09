const db = require('../database/db');

const getStatusFromColumnName = (columnName) => {
  const name = columnName?.toLowerCase() || '';
  if (name.includes('progress')) return 'in_progress';
  if (name.includes('review')) return 'in_review';
  if (name.includes('done') || name.includes('complete')) return 'done';
  return 'todo';
};

exports.getTasks = (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id, assigned_to, priority, status, search } = req.query;

    let query = `
      SELECT t.*, 
        u.name as assignee_name, u.avatar as assignee_avatar, u.username as assignee_username,
        cu.name as creator_name,
        p.name as project_name, p.color as project_color,
        c.name as column_name,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users cu ON t.created_by = cu.id
      JOIN projects p ON t.project_id = p.id
      JOIN columns c ON t.column_id = c.id
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    `;

    const params = [userId];
    const conditions = [];

    if (project_id) {
      conditions.push('t.project_id = ?');
      params.push(project_id);
    }

    if (assigned_to) {
      conditions.push('t.assigned_to = ?');
      params.push(assigned_to);
    } else if (req.query.my_tasks === 'true') {
      conditions.push('t.assigned_to = ?');
      params.push(userId);
    }

    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.position ASC, t.created_at DESC';

    const tasks = db.prepare(query).all(...params);

    const tasksWithLabels = tasks.map(t => ({
      ...t,
      labels: JSON.parse(t.labels || '[]'),
      is_overdue: t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
    }));

    res.json({ tasks: tasksWithLabels });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Server error fetching tasks.' });
  }
};

exports.createTask = (req, res) => {
  try {
    const { project_id, column_id, title, description, assigned_to, priority, due_date, start_date, labels } = req.body;
    const userId = req.user.id;

    if (!project_id || !title || !column_id) {
      return res.status(400).json({ error: 'Project, column, and title are required.' });
    }

    // Verify user is member of project
    const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(project_id, userId);
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    const maxPosition = db.prepare('SELECT MAX(position) as maxPos FROM tasks WHERE column_id = ?').get(column_id);
    const position = (maxPosition.maxPos ?? -1) + 1;

    const column = db.prepare('SELECT name FROM columns WHERE id = ?').get(column_id);
    const status = getStatusFromColumnName(column?.name);

    const result = db.prepare(`
      INSERT INTO tasks (project_id, column_id, title, description, assigned_to, priority, status, start_date, due_date, labels, position, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      project_id,
      column_id,
      title.trim(),
      description || '',
      assigned_to || null,
      priority || 'medium',
      status,
      start_date || null,
      due_date || null,
      JSON.stringify(labels || []),
      position,
      userId
    );

    const taskId = result.lastInsertRowid;

    // Notify assigned user
    if (assigned_to && parseInt(assigned_to) !== userId) {
      const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(project_id);
      db.prepare(`
        INSERT INTO notifications (user_id, message, type, related_task_id, related_project_id)
        VALUES (?, ?, 'task_assigned', ?, ?)
      `).run(assigned_to, `You were assigned to "${title.trim()}" in ${project?.name}`, taskId, project_id);
    }

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'created_task', ?)
    `).run(project_id, taskId, userId, `Created task "${title.trim()}"`);

    const task = db.prepare(`
      SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, u.username as assignee_username,
        cu.name as creator_name,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users cu ON t.created_by = cu.id
      WHERE t.id = ?
    `).get(taskId);

    res.status(201).json({
      task: { ...task, labels: JSON.parse(task.labels || '[]') }
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error creating task.' });
  }
};

exports.getTask = (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, 
        u.name as assignee_name, u.avatar as assignee_avatar, u.username as assignee_username,
        cu.name as creator_name, cu.avatar as creator_avatar,
        p.name as project_name, p.color as project_color,
        c.name as column_name,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users cu ON t.created_by = cu.id
      JOIN projects p ON t.project_id = p.id
      JOIN columns c ON t.column_id = c.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Verify access
    const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
    if (!member) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ task: { ...task, labels: JSON.parse(task.labels || '[]') } });
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: 'Server error fetching task.' });
  }
};

exports.updateTask = (req, res) => {
  try {
    const { title, description, assigned_to, priority, status, due_date, start_date, labels, column_id, position } = req.body;
    const taskId = req.params.id;
    const userId = req.user.id;

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Verify membership
    const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(existingTask.project_id, userId);
    if (!member) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Determine new status from column if column changed
    let newStatus = status !== undefined ? status : existingTask.status;
    if (column_id && column_id !== existingTask.column_id) {
      const column = db.prepare('SELECT name FROM columns WHERE id = ?').get(column_id);
      newStatus = getStatusFromColumnName(column?.name);
    }

    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, assigned_to = ?, priority = ?, status = ?,
          start_date = ?, due_date = ?, labels = ?, column_id = ?, position = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title !== undefined ? title : existingTask.title,
      description !== undefined ? description : existingTask.description,
      assigned_to !== undefined ? (assigned_to || null) : existingTask.assigned_to,
      priority || existingTask.priority,
      newStatus,
      start_date !== undefined ? start_date : existingTask.start_date,
      due_date !== undefined ? due_date : existingTask.due_date,
      labels !== undefined ? JSON.stringify(labels) : existingTask.labels,
      column_id || existingTask.column_id,
      position !== undefined ? position : existingTask.position,
      taskId
    );

    // Notify if newly assigned
    if (assigned_to !== undefined && assigned_to && parseInt(assigned_to) !== existingTask.assigned_to && parseInt(assigned_to) !== userId) {
      const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(existingTask.project_id);
      db.prepare(`
        INSERT INTO notifications (user_id, message, type, related_task_id, related_project_id)
        VALUES (?, ?, 'task_assigned', ?, ?)
      `).run(assigned_to, `You were assigned to "${existingTask.title}" in ${project?.name}`, taskId, existingTask.project_id);
    }

    // Log status change
    if (status && status !== existingTask.status) {
      db.prepare(`
        INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
        VALUES (?, ?, ?, 'status_change', ?)
      `).run(existingTask.project_id, taskId, userId, `Changed status of "${existingTask.title}" to ${newStatus}`);
    } else if (column_id && column_id !== existingTask.column_id) {
      db.prepare(`
        INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
        VALUES (?, ?, ?, 'status_change', ?)
      `).run(existingTask.project_id, taskId, userId, `Moved "${existingTask.title}"`);
    }

    const updatedTask = db.prepare(`
      SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, u.username as assignee_username,
        cu.name as creator_name,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users cu ON t.created_by = cu.id
      WHERE t.id = ?
    `).get(taskId);

    res.json({ task: { ...updatedTask, labels: JSON.parse(updatedTask.labels || '[]') } });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Server error updating task.' });
  }
};

exports.deleteTask = (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, userId);
    if (!member) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Only admin or task creator can delete
    if (member.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot delete tasks.' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

    db.prepare(`
      INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'deleted_task', ?)
    `).run(task.project_id, null, userId, `Deleted task "${task.title}"`);

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Server error deleting task.' });
  }
};

exports.moveTask = (req, res) => {
  try {
    const { taskId } = req.params;
    const { column_id, position } = req.body;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
    if (!member) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const column = db.prepare('SELECT name FROM columns WHERE id = ?').get(column_id);
    const newStatus = getStatusFromColumnName(column?.name);

    db.prepare(`
      UPDATE tasks SET column_id = ?, position = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(column_id, position ?? 0, newStatus, taskId);

    // Log
    db.prepare(`
      INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'moved_task', ?)
    `).run(task.project_id, taskId, req.user.id, `Moved "${task.title}" to ${column?.name}`);

    res.json({ message: 'Task moved successfully.', status: newStatus });
  } catch (err) {
    console.error('Move task error:', err);
    res.status(500).json({ error: 'Server error moving task.' });
  }
};

exports.getDashboardStats = (req, res) => {
  try {
    const userId = req.user.id;

    const totalProjects = db.prepare(`
      SELECT COUNT(DISTINCT pm.project_id) as count FROM project_members pm WHERE pm.user_id = ?
    `).get(userId).count;

    const activeProjects = db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count FROM projects p
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
      WHERE p.status = 'active'
    `).get(userId).count;

    const totalTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      WHERE t.assigned_to = ?
    `).get(userId, userId).count;

    const completedTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.assigned_to = ? AND t.status = 'done'
    `).get(userId).count;

    const pendingTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.assigned_to = ? AND t.status != 'done'
    `).get(userId).count;

    const overdueTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.assigned_to = ? AND t.status != 'done' 
        AND t.due_date IS NOT NULL AND t.due_date < date('now')
    `).get(userId).count;

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT al.*, u.name as user_name, u.avatar as user_avatar,
        p.name as project_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN projects p ON al.project_id = p.id
      JOIN project_members pm ON pm.project_id = al.project_id AND pm.user_id = ?
      ORDER BY al.created_at DESC
      LIMIT 10
    `).all(userId);

    // Task completion trend (last 7 days)
    const trend = db.prepare(`
      SELECT date(updated_at) as date, COUNT(*) as count
      FROM tasks
      WHERE assigned_to = ? AND status = 'done'
        AND updated_at >= date('now', '-7 days')
      GROUP BY date(updated_at)
      ORDER BY date ASC
    `).all(userId);

    res.json({
      stats: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
      },
      recentActivity,
      trend,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Server error fetching dashboard stats.' });
  }
};
