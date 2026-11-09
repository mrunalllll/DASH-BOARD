const jwt = require('jsonwebtoken');
const db = require('../database/db');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, name, username, email, avatar, bio FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const isProjectMember = (req, res, next) => {
  const projectId = req.params.projectId || req.params.id || req.body.project_id;
  const userId = req.user.id;

  const member = db.prepare(`
    SELECT pm.role FROM project_members pm
    WHERE pm.project_id = ? AND pm.user_id = ?
  `).get(projectId, userId);

  if (!member) {
    // Check if project owner
    const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);
    if (!project || project.owner_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }
  }

  req.memberRole = member ? member.role : 'admin';
  next();
};

const isProjectAdmin = (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;

  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);

  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (project.owner_id === userId) {
    req.memberRole = 'admin';
    return next();
  }

  const member = db.prepare(`
    SELECT role FROM project_members WHERE project_id = ? AND user_id = ?
  `).get(projectId, userId);

  if (!member || member.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  req.memberRole = 'admin';
  next();
};

module.exports = { authenticate, isProjectMember, isProjectAdmin };
