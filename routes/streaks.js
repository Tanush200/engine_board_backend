const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const streakController = require('../controllers/streakController');

// @route   GET api/streaks
// @desc    Get user streak data
// @access  Private
router.get('/', auth, streakController.getStreakData);

module.exports = router;
