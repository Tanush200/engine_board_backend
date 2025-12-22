const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createCourse,
    getCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    addSyllabusTopic,
    toggleSyllabusTopic,
    addResource,
    deleteResource,
    updateAttendance
} = require('../controllers/courseController');


router.post('/', auth, createCourse);
router.get('/', auth, getCourses);
router.get('/:id', auth, getCourse);
router.put('/:id', auth, updateCourse);
router.delete('/:id', auth, deleteCourse);

router.post('/:id/syllabus', auth, addSyllabusTopic);
router.put('/:id/syllabus/:topicId/toggle', auth, toggleSyllabusTopic);

router.post('/:id/resources', auth, addResource);
router.delete('/:id/resources/:resourceId', auth, deleteResource);

router.put('/:id/attendance', auth, updateAttendance);

module.exports = router;