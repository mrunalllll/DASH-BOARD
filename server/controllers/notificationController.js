const db = require('../database/db');

exports.getNotifications = (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = db.prepare(`
      SELECT n.*, 
        t.title as task_title,
        p.name as project_name
      FROM notifications n
      LEFT JOIN tasks t ON n.related_task_id = t.id
      LEFT JOIN projects p ON n.related_project_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `).all(userId);

    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId).count;

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Server error fetching notifications.' });
  }
};

exports.markAsRead = (req, res) => {
  try {
    const { id: notifId } = req.params;
    const userId = req.user.id;

    const notif = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(notifId, userId);
    if (!notif) return res.status(404).json({ error: 'Notification not found.' });

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notifId);

    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.markAllAsRead = (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.deleteNotification = (req, res) => {
  try {
    const { id: notifId } = req.params;
    const userId = req.user.id;

    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(notifId, userId);

    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};
