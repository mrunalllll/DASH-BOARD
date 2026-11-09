const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const boardController = require('../controllers/boardController');
const { authenticate, isProjectMember, isProjectAdmin } = require('../middleware/auth');

// Project CRUD
router.get('/', authenticate, projectController.getProjects);
router.post('/', authenticate, projectController.createProject);
router.get('/:id', authenticate, isProjectMember, projectController.getProject);
router.put('/:id', authenticate, isProjectAdmin, projectController.updateProject);
router.delete('/:id', authenticate, projectController.deleteProject);

// Members
router.get('/:id/members', authenticate, isProjectMember, projectController.getMembers);
router.post('/:id/members', authenticate, isProjectAdmin, projectController.addMember);
router.delete('/:id/members/:userId', authenticate, isProjectAdmin, projectController.removeMember);
router.put('/:id/members/:userId/role', authenticate, isProjectAdmin, projectController.updateMemberRole);

// Activity
router.get('/:id/activity', authenticate, isProjectMember, projectController.getActivity);

// Board
router.get('/:projectId/board', authenticate, isProjectMember, boardController.getBoard);
router.post('/:projectId/columns', authenticate, isProjectMember, boardController.createColumn);
router.put('/:projectId/columns/:columnId', authenticate, isProjectMember, boardController.updateColumn);
router.delete('/:projectId/columns/:columnId', authenticate, isProjectAdmin, boardController.deleteColumn);
router.put('/:projectId/columns/reorder', authenticate, isProjectMember, boardController.reorderColumns);

module.exports = router;
