const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

router.put('/:id', authenticate, commentController.updateComment);
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;
