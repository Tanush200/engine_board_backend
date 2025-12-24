const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const studyPlanController = require('../controllers/studyPlanController');

// Generate a new study plan
router.post('/generate', auth, studyPlanController.generateStudyPlan);

// Get latest active study plan
router.get('/latest', auth, studyPlanController.getLatestActivePlan);

// Get active study plan for a course
router.get('/:courseId', auth, studyPlanController.getStudyPlan);

// Complete a topic and rate confidence
router.put('/:id/complete-topic', auth, studyPlanController.completeTopicAndRate);

// Trigger adaptive replanning
router.put('/:id/replan', auth, studyPlanController.adaptiveReplan);

// Get spaced repetition review schedule
router.get('/:id/review-schedule', auth, studyPlanController.getReviewSchedule);

// Get confidence tracking data
router.get('/:courseId/confidence', auth, studyPlanController.getConfidenceTracking);

// Add collaborator
router.post('/:id/collaborators', auth, studyPlanController.addCollaborator);

module.exports = router;
