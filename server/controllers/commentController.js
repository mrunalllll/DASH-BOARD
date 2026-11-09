const db = require('../database/db');

exports.getComments = (req, res) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user.id;

    const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, userId);
    if (!member) return res.status(403).json({ error: 'Access denied.' });

    const comments = db.prepare(`
      SELECT c.*, u.name as author_name, u.username as author_username, u.avatar as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `).all(taskId);

    res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Server error fetching comments.' });
  }
};

exports.createComment = (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required.' });
    }

    const task = db.prepare(`
      SELECT t.*, p.name as project_name FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `).get(taskId);

    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, userId);
    if (!member) return res.status(403).json({ error: 'Access denied.' });

    const result = db.prepare(`
      INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)
    `).run(taskId, userId, content.trim());

    // Notify task assignee if different from commenter
    if (task.assigned_to && task.assigned_to !== userId) {
      const commenter = db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
      db.prepare(`
        INSERT INTO notifications (user_id, message, type, related_task_id, related_project_id)
        VALUES (?, ?, 'comment', ?, ?)
      `).run(task.assigned_to, `${commenter.name} commented on "${task.title}"`, taskId, task.project_id);
    }

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'added_comment', ?)
    `).run(task.project_id, taskId, userId, `Added a comment on "${task.title}"`);

    const comment = db.prepare(`
      SELECT c.*, u.name as author_name, u.username as author_username, u.avatar as author_avatar
      FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ comment });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Server error creating comment.' });
  }
};

exports.updateComment = (req, res) => {
  try {
    const { id: commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments.' });
    }

    db.prepare('UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(content.trim(), commentId);

    const updated = db.prepare(`
      SELECT c.*, u.name as author_name, u.username as author_username, u.avatar as author_avatar
      FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `).get(commentId);

    res.json({ comment: updated });
  } catch (err) {
    console.error('Update comment error:', err);
    res.status(500).json({ error: 'Server error updating comment.' });
  }
};

exports.deleteComment = (req, res) => {
  try {
    const { id: commentId } = req.params;
    const userId = req.user.id;

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    // Allow deleting own comment or if project admin
    if (comment.user_id !== userId) {
      const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(comment.task_id);
      const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, userId);
      if (!member || member.role !== 'admin') {
        return res.status(403).json({ error: 'You can only delete your own comments.' });
      }
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

    res.json({ message: 'Comment deleted successfully.' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Server error deleting comment.' });
  }
};
