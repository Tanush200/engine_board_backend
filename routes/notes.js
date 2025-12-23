const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const noteController = require('../controllers/noteController');

router.get('/', auth, noteController.getNotes);
router.post('/', auth, noteController.createNote);
router.put('/:id', auth, noteController.updateNote);
router.delete('/:id', auth, noteController.deleteNote);

module.exports = router;
