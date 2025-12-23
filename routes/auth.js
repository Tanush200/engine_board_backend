const express = require('express')
const router = express.Router();
const auth = require('../middleware/auth');
const { login, register, updateProfile, getMe } = require('../controllers/authController')

router.post('/register', register);
router.post('/login', login);
router.put('/profile', auth, updateProfile);
router.get('/me', auth, getMe);

module.exports = router;