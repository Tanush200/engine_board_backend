const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const auth = require('../middleware/auth');

router.get('/', auth, resourceController.getResources);
router.post('/seed', auth, resourceController.seedResources);

module.exports = router;
