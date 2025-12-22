const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createEvent,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent,
    getCalendarItems
} = require('../controllers/eventController');

router.post('/', auth, createEvent);
router.get('/', auth, getEvents);
router.get('/calendar', auth, getCalendarItems);
router.get('/:id', auth, getEvent);
router.put('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);

module.exports = router;
