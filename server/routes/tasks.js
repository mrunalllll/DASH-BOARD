const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

router.get('/dashboard-stats', authenticate, taskController.getDashboardStats);
router.get('/', authenticate, taskController.getTasks);
router.post('/', authenticate, taskController.createTask);
router.get('/:id', authenticate, taskController.getTask);
router.put('/:id', authenticate, taskController.updateTask);
router.delete('/:id', authenticate, taskController.deleteTask);
router.put('/:taskId/move', authenticate, taskController.moveTask);

// Comments
router.get('/:id/comments', authenticate, commentController.getComments);
router.post('/:id/comments', authenticate, commentController.createComment);

module.exports = router;
