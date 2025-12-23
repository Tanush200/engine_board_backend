const ChatMessage = require('../models/ChatMessage');
const Task = require('../models/Task');
const User = require('../models/User');
const aiChatService = require('../services/aiChatService');

/**
 * Send message to AI chat
 * POST /api/ai-chat/message
 */
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Get or create chat session
        const chat = await ChatMessage.getOrCreateChat(userId);

        // Check daily limit (50 messages for free users)
        if (chat.hasReachedDailyLimit(50)) {
            return res.status(429).json({
                message: 'Daily message limit reached',
                limit: 50,
                resetTime: new Date(new Date().setHours(24, 0, 0, 0))
            });
        }

        // Get conversation history
        const history = chat.getConversation(10); // Last 10 messages

        // Get AI response
        const response = await aiChatService.chatWithContext(
            message,
            userId,
            history.map(m => ({ role: m.role, content: m.content }))
        );

        // Save user message
        await chat.addMessage('user', message);

        // Save AI response
        await chat.addMessage('assistant', response.message, response.contextUsed);

        res.json({
            message: response.message,
            contextUsed: response.contextUsed,
            messagesRemaining: 50 - chat.todayMessageCount
        });

    } catch (error) {
        console.error('Error in AI chat:', error);
        res.status(500).json({
            message: 'Failed to get AI response',
            error: error.message
        });
    }
};

/**
 * Get chat history
 * GET /api/ai-chat/history
 */
exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20 } = req.query;

        const chat = await ChatMessage.getOrCreateChat(userId);
        const history = chat.getConversation(parseInt(limit));

        res.json({
            messages: history,
            totalMessages: chat.messageCount,
            todayCount: chat.todayMessageCount,
            dailyLimit: 50
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Failed to fetch chat history', error: error.message });
    }
};

/**
 * Generate daily plan
 * POST /api/ai-chat/daily-plan
 */
exports.generateDailyPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { availableHours = 4 } = req.body;

        const plan = await aiChatService.generateDailyPlan(userId, availableHours);

        // Save to chat history
        const chat = await ChatMessage.getOrCreateChat(userId);
        await chat.addMessage('assistant', `Daily Plan Generated:\n\n${plan.plan}`, {
            tasksAnalyzed: plan.tasksIncluded.map(t => t.title),
            coursesConsidered: [...new Set(plan.tasksIncluded.map(t => t.course))]
        });

        res.json({
            plan: plan.plan,
            tasksIncluded: plan.tasksIncluded,
            availableHours: plan.availableHours
        });

    } catch (error) {
        console.error('Error generating daily plan:', error);
        res.status(500).json({ message: 'Failed to generate daily plan', error: error.message });
    }
};

/**
 * Break down vague task
 * POST /api/ai-chat/breakdown-task
 */
exports.breakdownTask = async (req, res) => {
    try {
        const { taskDescription, courseContext, createSubtasks = false } = req.body;
        const userId = req.user.id;

        if (!taskDescription) {
            return res.status(400).json({ message: 'Task description is required' });
        }

        const breakdown = await aiChatService.breakdownVagueTask(taskDescription, courseContext);

        // Optionally create actual subtasks
        let createdTasks = [];
        if (createSubtasks && breakdown.subtasks.length > 0) {
            // Create parent task
            const parentTask = new Task({
                user: userId,
                title: taskDescription,
                description: 'AI-generated task breakdown',
                aiGenerated: true,
                estimatedTime: breakdown.subtasks.reduce((sum, st) => sum + st.estimatedTime, 0)
            });
            await parentTask.save();

            // Create subtasks
            const subtaskPromises = breakdown.subtasks.map(async (subtask) => {
                const task = new Task({
                    user: userId,
                    title: subtask.title,
                    estimatedTime: subtask.estimatedTime,
                    aiGenerated: true,
                    parentTask: parentTask._id
                });
                await task.save();
                return task;
            });

            createdTasks = await Promise.all(subtaskPromises);

            // Update parent with subtask IDs
            parentTask.subtasks = createdTasks.map(t => t._id);
            await parentTask.save();
        }

        res.json({
            subtasks: breakdown.subtasks,
            fullResponse: breakdown.fullResponse,
            createdTasks: createdTasks.length > 0 ? {
                parentId: createdTasks[0].parentTask,
                subtaskIds: createdTasks.map(t => t._id)
            } : null
        });

    } catch (error) {
        console.error('Error breaking down task:', error);
        res.status(500).json({ message: 'Failed to break down task', error: error.message });
    }
};

/**
 * Analyze workload
 * GET /api/ai-chat/workload-analysis
 */
exports.analyzeWorkload = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetDate } = req.query;

        const target = targetDate ? new Date(targetDate) : new Date();
        const analysis = await aiChatService.analyzeDailyWorkload(userId, target);

        res.json({
            analysis: analysis.analysis,
            totalHours: analysis.totalHours,
            taskCount: analysis.taskCount,
            tasks: analysis.tasks
        });

    } catch (error) {
        console.error('Error analyzing workload:', error);
        res.status(500).json({ message: 'Failed to analyze workload', error: error.message });
    }
};

/**
 * Clear chat history
 * DELETE /api/ai-chat/history
 */
exports.clearChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const chat = await ChatMessage.findOne({ user: userId });
        if (chat) {
            chat.messages = [];
            chat.messageCount = 0;
            await chat.save();
        }

        res.json({ message: 'Chat history cleared' });

    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ message: 'Failed to clear chat history', error: error.message });
    }
};

/**
 * Generate roadmap
 * POST /api/ai-chat/roadmap
 */
exports.generateRoadmap = async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        const userId = req.user.id;
        const user = await User.findById(userId);

        // Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastGenerated = user.roadmapGeneration?.lastGeneratedDate ? new Date(user.roadmapGeneration.lastGeneratedDate) : null;
        if (lastGenerated) {
            lastGenerated.setHours(0, 0, 0, 0);
        }

        // Reset count if new day
        if (!lastGenerated || lastGenerated < today) {
            user.roadmapGeneration = {
                count: 0,
                lastGeneratedDate: null
            };
        }

        if (user.roadmapGeneration.count >= 3) {
            return res.status(429).json({
                message: 'Daily roadmap limit reached (3/3). Please try again tomorrow.'
            });
        }

        const roadmap = await aiChatService.generateRoadmap(topic);

        // Update usage
        user.roadmapGeneration.count += 1;
        user.roadmapGeneration.lastGeneratedDate = new Date();
        await user.save();

        res.json({ roadmap, remaining: 3 - user.roadmapGeneration.count });

    } catch (error) {
        console.error('Error generating roadmap:', error);
        res.status(500).json({ message: 'Failed to generate roadmap', error: error.message });
    }
};
