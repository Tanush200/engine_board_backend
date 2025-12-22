const express = require('express')
const router = express.Router();
const auth = require('../middleware/auth')
const { createTask, getTasks, updateTasks, deleteTask } = require('../controllers/taskController')


router.post('/', auth, createTask);
router.get('/', auth, getTasks);
router.put('/:id', auth, updateTasks);
router.delete('/:id', auth, deleteTask);


module.exports = router;