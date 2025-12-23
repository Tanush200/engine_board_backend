const axios = require('axios');
const Task = require('../models/Task');
const Course = require('../models/Course');

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Helper to call Perplexity API
 */
const callPerplexity = async (messages, model = 'sonar-pro') => {
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

    // Debug logging
    console.log('🔑 API Key status:', PERPLEXITY_API_KEY ? `Loaded (${PERPLEXITY_API_KEY.substring(0, 10)}...)` : '❌ NOT FOUND');
    console.log('🤖 Using model:', model);

    try {
        const response = await axios.post(
            PERPLEXITY_API_URL,
            { model, messages },
            {
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ API call successful');
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('❌ Perplexity API Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        throw new Error('Failed to get AI response');
    }
};

/**
 * Build user context for AI
 */
const buildUserContext = async (userId) => {
    try {
        // Get user's tasks
        const tasks = await Task.find({ user: userId }).populate('course').lean();

        // Get user's courses
        const courses = await Course.find({ user: userId }).lean();

        // Filter upcoming tasks (due within 14 days)
        const now = new Date();
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        const upcomingTasks = tasks.filter(task => {
            if (!task.deadline) return false;
            const deadline = new Date(task.deadline);
            return deadline >= now && deadline <= twoWeeksLater;
        }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        // Calculate completed tasks today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const completedToday = tasks.filter(task =>
            task.status === 'Done' &&
            task.updatedAt >= todayStart
        );

        // Calculate average completion times by type
        const completedTasks = tasks.filter(t => t.status === 'Done' && t.actualTime);
        const avgTimes = {};
        if (completedTasks.length > 0) {
            completedTasks.forEach(task => {
                const type = task.course?.name || 'general';
                if (!avgTimes[type]) avgTimes[type] = [];
                avgTimes[type].push(task.actualTime);
            });
            Object.keys(avgTimes).forEach(type => {
                const times = avgTimes[type];
                avgTimes[type] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            });
        }

        return {
            upcomingTasks: upcomingTasks.map(t => ({
                title: t.title,
                course: t.course?.name || 'General',
                deadline: t.deadline,
                priority: t.priority,
                status: t.status,
                estimatedTime: t.estimatedTime || 120, // default 2 hours
                description: t.description
            })),
            completedToday: completedToday.map(t => t.title),
            courses: courses.map(c => c.name),
            averageCompletionTimes: avgTimes,
            currentDate: now.toISOString().split('T')[0]
        };
    } catch (error) {
        console.error('Error building user context:', error);
        return {
            upcomingTasks: [],
            completedToday: [],
            courses: [],
            averageCompletionTimes: {},
            currentDate: new Date().toISOString().split('T')[0]
        };
    }
};

/**
 * Chat with AI using user's context
 */
const chatWithContext = async (userMessage, userId, conversationHistory = []) => {
    const context = await buildUserContext(userId);

    const systemPrompt = `You are an AI Study Buddy for a student. You help them manage their workload, create daily plans, and stay on track with deadlines.

Your personality:
- Friendly and encouraging
- Honest about feasibility
- Proactive with suggestions
- Use emojis occasionally 😊

Current student context:
- Upcoming tasks: ${JSON.stringify(context.upcomingTasks, null, 2)}
- Completed today: ${context.completedToday.join(', ') || 'None yet'}
- Enrolled courses: ${context.courses.join(', ')}
- Average task completion times: ${JSON.stringify(context.averageCompletionTimes)}
- Current date: ${context.currentDate}

Instructions:
- Use the student's actual task data in your responses
- Be specific with task names and deadlines
- Provide realistic time estimates
- Suggest priorities based on urgency
- Keep responses concise but helpful`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-6), // Last 6 messages for context
        { role: 'user', content: userMessage }
    ];

    const response = await callPerplexity(messages, 'sonar-pro');

    return {
        message: response,
        contextUsed: {
            tasksAnalyzed: context.upcomingTasks.map(t => t.title),
            coursesConsidered: context.courses
        }
    };
};

/**
 * Analyze daily workload
 */
const analyzeDailyWorkload = async (userId, targetDate = new Date()) => {
    const context = await buildUserContext(userId);

    const target = new Date(targetDate);
    const tasksForDate = context.upcomingTasks.filter(task => {
        const deadline = new Date(task.deadline);
        return deadline <= target;
    });

    const totalTime = tasksForDate.reduce((sum, task) => sum + (task.estimatedTime || 120), 0);
    const totalHours = Math.round(totalTime / 60 * 10) / 10;

    const prompt = `Analyze this workload for ${target.toDateString()}:

Tasks to complete by this date:
${tasksForDate.map(t => `- ${t.title} (${t.course}, ${Math.round((t.estimatedTime || 120) / 60)}h, Priority: ${t.priority})`).join('\n')}

Total estimated time: ${totalHours} hours

Provide:
1. Feasibility assessment (Can complete? Yes/No)
2. Recommended daily hours
3. Priority order
4. What to focus on first`;

    const response = await callPerplexity([
        { role: 'user', content: prompt }
    ]);

    return {
        analysis: response,
        totalHours,
        taskCount: tasksForDate.length,
        tasks: tasksForDate
    };
};

/**
 * Generate daily plan
 */
const generateDailyPlan = async (userId, availableHours = 4) => {
    const context = await buildUserContext(userId);

    const urgentTasks = context.upcomingTasks.slice(0, 10); // Top 10 urgent

    const prompt = `Create a detailed daily study plan for today.

Available time: ${availableHours} hours
Current date: ${context.currentDate}

Urgent tasks:
${urgentTasks.map((t, i) => {
        const deadline = new Date(t.deadline);
        const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
        return `${i + 1}. ${t.title} (${t.course})
   - Due: ${deadline.toDateString()} (${daysUntil} days)
   - Priority: ${t.priority}
   - Estimated: ${Math.round((t.estimatedTime || 120) / 60)}h`;
    }).join('\n\n')}

Average speed: ${JSON.stringify(context.averageCompletionTimes)}

Create a realistic plan:
1. Prioritize by urgency and importance
2. Include specific time slots
3. Add break times
4. Total should fit in ${availableHours} hours
5. Be specific about which tasks to work on

Format as a numbered list with time allocations.`;

    const response = await callPerplexity([
        { role: 'user', content: prompt }
    ], 'sonar-pro');

    return {
        plan: response,
        tasksIncluded: urgentTasks,
        availableHours
    };
};

/**
 * Break down vague task into subtasks
 */
const breakdownVagueTask = async (taskDescription, courseContext = null) => {
    const prompt = `Break down this task into specific, actionable subtasks:

Task: "${taskDescription}"
${courseContext ? `Course: ${courseContext}` : ''}

Create 8-12 specific subtasks that are:
- Actionable (clear what to do)
- Specific (not vague)
- Time-estimated (include estimated minutes)
- Ordered logically

Format each subtask as:
- [Subtask name] (estimated time)

Example for "Prepare for DSA exam":
- Review arrays and strings concepts (30 min)
- Solve 5 array problems on LeetCode (60 min)
- Study linked list implementation (45 min)
etc.`;

    const response = await callPerplexity([
        { role: 'user', content: prompt }
    ]);

    // Parse response to extract subtasks
    const subtaskPattern = /- (.+) \((\d+) min\)/gi;
    const matches = [...response.matchAll(subtaskPattern)];

    const subtasks = matches.map(match => ({
        title: match[1].trim(),
        estimatedTime: parseInt(match[2])
    }));

    return {
        subtasks,
        fullResponse: response
    };
};

/**
 * Answer workload questions
 */
const answerWorkloadQuestion = async (question, userId) => {
    const context = await buildUserContext(userId);

    const prompt = `Student question: "${question}"

Context:
- Upcoming tasks: ${JSON.stringify(context.upcomingTasks, null, 2)}
- Completed today: ${context.completedToday.join(', ') || 'None'}
- Current date: ${context.currentDate}

Provide a clear, honest answer:
- Use actual task data
- Be realistic about feasibility
- Include specific recommendations
- Keep response concise (2-3 paragraphs max)`;

    const response = await callPerplexity([
        { role: 'user', content: prompt }
    ], 'sonar-pro');

    return response;
};

module.exports = {
    chatWithContext,
    analyzeDailyWorkload,
    generateDailyPlan,
    breakdownVagueTask,
    answerWorkloadQuestion,
    buildUserContext
};
