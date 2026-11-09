const db = require('../database/db');

// Helper: get project with member count and task stats
const getProjectWithStats = (projectId, userId) => {
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name, u.username as owner_username,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_tasks
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `).get(projectId);

  if (!project) return null;

  project.completion_percentage = project.total_tasks > 0
    ? Math.round((project.completed_tasks / project.total_tasks) * 100)
    : 0;

  return project;
};

exports.getProjects = (req, res) => {
  try {
    const userId = req.user.id;

    const projects = db.prepare(`
      SELECT DISTINCT p.*, u.name as owner_name, u.username as owner_username,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_tasks,
        pm.role as my_role
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
      ORDER BY p.created_at DESC
    `).all(userId);

    const projectsWithStats = projects.map(p => ({
      ...p,
      completion_percentage: p.total_tasks > 0
        ? Math.round((p.completed_tasks / p.total_tasks) * 100)
        : 0
    }));

    res.json({ projects: projectsWithStats });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Server error fetching projects.' });
  }
};

exports.createProject = (req, res) => {
  try {
    const { name, description, start_date, due_date, visibility, color } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const result = db.prepare(`
      INSERT INTO projects (name, description, owner_id, start_date, due_date, visibility, color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      description || '',
      userId,
      start_date || null,
      due_date || null,
      visibility || 'private',
      color || '#6366F1'
    );

    const projectId = result.lastInsertRowid;

    // Add owner as admin member
    db.prepare(`
      INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'admin')
    `).run(projectId, userId);

    // Create default board
    const board = db.prepare(`
      INSERT INTO boards (project_id, name) VALUES (?, 'Main Board')
    `).run(projectId);

    const boardId = board.lastInsertRowid;

    // Create default columns
    const columns = ['To Do', 'In Progress', 'In Review', 'Done'];
    columns.forEach((name, idx) => {
      db.prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)').run(boardId, name, idx);
    });

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (project_id, user_id, action, details)
      VALUES (?, ?, 'created_project', ?)
    `).run(projectId, userId, `Created project "${name.trim()}"`);

    const project = getProjectWithStats(projectId, userId);

    res.status(201).json({ project });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Server error creating project.' });
  }
};

exports.getProject = (req, res) => {
  try {
    const project = getProjectWithStats(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Server error fetching project.' });
  }
};

exports.updateProject = (req, res) => {
  try {
    const { name, description, start_date, due_date, status, visibility, color } = req.body;
    const projectId = req.params.id;

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    db.prepare(`
      UPDATE projects
      SET name = ?, description = ?, start_date = ?, due_date = ?,
          status = ?, visibility = ?, color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || project.name,
      description !== undefined ? description : project.description,
      start_date !== undefined ? start_date : project.start_date,
      due_date !== undefined ? due_date : project.due_date,
      status || project.status,
      visibility || project.visibility,
      color || project.color,
      projectId
    );

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (project_id, user_id, action, details)
      VALUES (?, ?, 'updated_project', ?)
    `).run(projectId, req.user.id, `Updated project details`);

    const updated = getProjectWithStats(projectId, req.user.id);
    res.json({ project: updated });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Server error updating project.' });
  }
};

exports.deleteProject = (req, res) => {
  try {
    const projectId = req.params.id;

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only project owner can delete the project.' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);

    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Server error deleting project.' });
  }
};

exports.getMembers = (req, res) => {
  try {
    const members = db.prepare(`
      SELECT u.id, u.name, u.username, u.email, u.avatar, pm.role, pm.joined_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.joined_at ASC
    `).all(req.params.id);

    res.json({ members });
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ error: 'Server error fetching members.' });
  }
};

exports.addMember = (req, res) => {
  try {
    const { email, role } = req.body;
    const projectId = req.params.id;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = db.prepare('SELECT id, name, username, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({ error: 'No user found with that email address.' });
    }

    const existing = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, user.id);
    if (existing) {
      return res.status(409).json({ error: 'User is already a member of this project.' });
    }

    db.prepare(`
      INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)
    `).run(projectId, user.id, role || 'member');

    // Send notification to added user
    const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(projectId);
    db.prepare(`
      INSERT INTO notifications (user_id, message, type, related_project_id)
      VALUES (?, ?, 'project_invite', ?)
    `).run(user.id, `You were added to project "${project.name}"`, projectId);

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (project_id, user_id, action, details)
      VALUES (?, ?, 'added_member', ?)
    `).run(projectId, req.user.id, `Added ${user.name} to the project`);

    const member = db.prepare(`
      SELECT u.id, u.name, u.username, u.email, u.avatar, pm.role, pm.joined_at
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ? AND pm.user_id = ?
    `).get(projectId, user.id);

    res.status(201).json({ member });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Server error adding member.' });
  }
};

exports.removeMember = (req, res) => {
  try {
    const { id: projectId, userId: targetUserId } = req.params;

    const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);

    if (parseInt(targetUserId) === project.owner_id) {
      return res.status(403).json({ error: 'Cannot remove project owner.' });
    }

    const result = db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, targetUserId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Log activity
    const removedUser = db.prepare('SELECT name FROM users WHERE id = ?').get(targetUserId);
    db.prepare(`
      INSERT INTO activity_logs (project_id, user_id, action, details)
      VALUES (?, ?, 'removed_member', ?)
    `).run(projectId, req.user.id, `Removed ${removedUser?.name || 'user'} from the project`);

    res.json({ message: 'Member removed successfully.' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Server error removing member.' });
  }
};

exports.updateMemberRole = (req, res) => {
  try {
    const { id: projectId, userId: targetUserId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const result = db.prepare('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?').run(role, projectId, targetUserId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    res.json({ message: 'Role updated successfully.' });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Server error updating role.' });
  }
};

exports.getActivity = (req, res) => {
  try {
    const activities = db.prepare(`
      SELECT al.*, u.name as user_name, u.avatar as user_avatar
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.project_id = ?
      ORDER BY al.created_at DESC
      LIMIT 50
    `).all(req.params.id);

    res.json({ activities });
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({ error: 'Server error fetching activity.' });
  }
};
