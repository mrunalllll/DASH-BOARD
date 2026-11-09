const db = require('../database/db');

exports.search = (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length < 2) {
      return res.json({ projects: [], tasks: [], users: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    const projects = db.prepare(`
      SELECT DISTINCT p.id, p.name, p.description, p.color, p.status
      FROM projects p
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
      WHERE p.name LIKE ? OR p.description LIKE ?
      LIMIT 5
    `).all(userId, searchTerm, searchTerm);

    const tasks = db.prepare(`
      SELECT DISTINCT t.id, t.title, t.description, t.priority, t.status, t.due_date,
        p.name as project_name, p.color as project_color
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      WHERE t.title LIKE ? OR t.description LIKE ?
      LIMIT 10
    `).all(userId, searchTerm, searchTerm);

    const users = db.prepare(`
      SELECT DISTINCT u.id, u.name, u.username, u.email, u.avatar
      FROM users u
      JOIN project_members pm1 ON pm1.user_id = u.id
      JOIN project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.user_id = ?
      WHERE (u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ?) AND u.id != ?
      LIMIT 5
    `).all(userId, searchTerm, searchTerm, searchTerm, userId);

    res.json({ projects, tasks, users });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error during search.' });
  }
};
