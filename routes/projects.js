const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');

// @route   GET api/projects
// @desc    Get all projects
// @access  Private
router.get('/', auth, projectController.getProjects);

// @route   POST api/projects
// @desc    Create a project
// @access  Private
router.post('/', auth, projectController.createProject);

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', auth, projectController.updateProject);

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', auth, projectController.deleteProject);

module.exports = router;
