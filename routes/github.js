const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const auth = require('../middleware/auth');

router.get('/:owner/:repo/commits', auth, githubController.getCommits);
router.get('/:owner/:repo', auth, githubController.getRepoDetails);

module.exports = router;
