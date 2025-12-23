const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const resourceController = require('../controllers/resourceController');

// @route   GET api/resources/search
// @desc    Search for educational videos
// @access  Private
router.get('/search', auth, resourceController.searchResources);

module.exports = router;
