const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiChatController = require('../controllers/aiChatController');

// Send message to AI
router.post('/message', auth, aiChatController.sendMessage);

// Get chat history
router.get('/history', auth, aiChatController.getChatHistory);

// Generate daily plan
router.post('/daily-plan', auth, aiChatController.generateDailyPlan);

// Break down vague task into subtasks
router.post('/breakdown-task', auth, aiChatController.breakdownTask);

// Analyze workload
router.get('/workload-analysis', auth, aiChatController.analyzeWorkload);

// Clear chat history
router.delete('/history', auth, aiChatController.clearChatHistory);

// Generate roadmap
router.post('/roadmap', auth, aiChatController.generateRoadmap);

module.exports = router;
