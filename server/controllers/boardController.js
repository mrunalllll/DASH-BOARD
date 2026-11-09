const db = require('../database/db');

exports.getBoard = (req, res) => {
  try {
    const { projectId } = req.params;

    const board = db.prepare('SELECT * FROM boards WHERE project_id = ?').get(projectId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found.' });
    }

    const columns = db.prepare(`
      SELECT c.*, COUNT(t.id) as task_count
      FROM columns c
      LEFT JOIN tasks t ON t.column_id = c.id
      WHERE c.board_id = ?
      GROUP BY c.id
      ORDER BY c.position ASC
    `).all(board.id);

    const tasks = db.prepare(`
      SELECT t.*, 
        u.name as assignee_name, u.avatar as assignee_avatar, u.username as assignee_username,
        cu.name as creator_name,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users cu ON t.created_by = cu.id
      WHERE t.project_id = ?
      ORDER BY t.position ASC, t.created_at ASC
    `).all(projectId);

    // Group tasks by column
    const tasksByColumn = {};
    columns.forEach(col => {
      tasksByColumn[col.id] = tasks.filter(t => t.column_id === col.id).map(t => ({
        ...t,
        labels: JSON.parse(t.labels || '[]')
      }));
    });

    res.json({ board, columns, tasksByColumn });
  } catch (err) {
    console.error('Get board error:', err);
    res.status(500).json({ error: 'Server error fetching board.' });
  }
};

exports.createColumn = (req, res) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Column name is required.' });
    }

    const board = db.prepare('SELECT * FROM boards WHERE project_id = ?').get(projectId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found.' });
    }

    const maxPosition = db.prepare('SELECT MAX(position) as maxPos FROM columns WHERE board_id = ?').get(board.id);
    const position = (maxPosition.maxPos ?? -1) + 1;

    const result = db.prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)').run(board.id, name.trim(), position);

    const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ column: { ...column, task_count: 0 } });
  } catch (err) {
    console.error('Create column error:', err);
    res.status(500).json({ error: 'Server error creating column.' });
  }
};

exports.updateColumn = (req, res) => {
  try {
    const { columnId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Column name is required.' });
    }

    db.prepare('UPDATE columns SET name = ? WHERE id = ?').run(name.trim(), columnId);

    const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(columnId);
    res.json({ column });
  } catch (err) {
    console.error('Update column error:', err);
    res.status(500).json({ error: 'Server error updating column.' });
  }
};

exports.deleteColumn = (req, res) => {
  try {
    const { columnId } = req.params;

    // Move tasks to first column or delete them
    const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(columnId);
    if (!column) {
      return res.status(404).json({ error: 'Column not found.' });
    }

    // Delete tasks in this column
    db.prepare('DELETE FROM tasks WHERE column_id = ?').run(columnId);
    db.prepare('DELETE FROM columns WHERE id = ?').run(columnId);

    res.json({ message: 'Column deleted successfully.' });
  } catch (err) {
    console.error('Delete column error:', err);
    res.status(500).json({ error: 'Server error deleting column.' });
  }
};

exports.reorderColumns = (req, res) => {
  try {
    const { columns } = req.body; // array of { id, position }

    const updateCol = db.prepare('UPDATE columns SET position = ? WHERE id = ?');
    const updateMany = db.transaction((cols) => {
      cols.forEach(col => updateCol.run(col.position, col.id));
    });

    updateMany(columns);

    res.json({ message: 'Columns reordered.' });
  } catch (err) {
    console.error('Reorder columns error:', err);
    res.status(500).json({ error: 'Server error reordering columns.' });
  }
};
