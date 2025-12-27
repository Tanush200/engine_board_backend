const express = require('express')
const router = express.Router();
const auth = require('../middleware/auth');
const { login, register, updateProfile, getMe, forgotPassword, resetPassword } = require('../controllers/authController')

router.post('/register', register);
router.post('/login', login);
router.put('/profile', auth, updateProfile);
router.get('/me', auth, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

module.exports = router;