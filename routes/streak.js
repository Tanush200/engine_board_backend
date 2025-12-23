const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { calculateStreaks } = require('../services/streakService');

// @route   GET api/streaks
// @desc    Get user's study streaks
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const streaks = await calculateStreaks(req.user.id);
        res.json(streaks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
