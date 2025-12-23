const StudyPlan = require('../models/StudyPlan');
const ConfidenceTracking = require('../models/ConfidenceTracking');
const Course = require('../models/Course');
const Resource = require('../models/Resource');
const perplexityService = require('../services/perplexityService');

/**
 * Generate a new study plan for a course
 * POST /api/study-plans/generate
 */
exports.generateStudyPlan = async (req, res) => {
    try {
        const { courseId, examDate, hoursPerDay, studentLevel } = req.body;
        const userId = req.user.id;

        // Validation
        if (!courseId || !examDate) {
            return res.status(400).json({ message: 'Course ID and exam date are required' });
        }

        const exam = new Date(examDate);
        if (exam <= new Date()) {
            return res.status(400).json({ message: 'Exam date must be in the future' });
        }

        // Get course details
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check if active plan already exists
        const existingPlan = await StudyPlan.findOne({
            user: userId,
            course: courseId,
            status: 'active'
        });

        if (existingPlan) {
            return res.status(400).json({
                message: 'Active study plan already exists for this course',
                existingPlan
            });
        }

        // Generate topic dependencies using AI
        console.log('Generating topic dependencies...');
        const syllabusTopics = course.syllabus.map(s => s.topic);
        const dependencies = await perplexityService.generateTopicDependencies(
            course.name,
            syllabusTopics
        );

        // Generate study plan using AI
        console.log('Generating study plan...');
        const aiPlan = await perplexityService.generateStudyPlan(
            course,
            examDate,
            studentLevel || 'intermediate',
            hoursPerDay || 4
        );

        // Calculate dates for each day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntilExam = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

        // Build schedule with actual dates
        const schedule = aiPlan.dailySchedule.map((dayPlan, index) => {
            const dayDate = new Date(today);
            dayDate.setDate(today.getDate() + index);

            return {
                day: index + 1,
                date: dayDate,
                topics: dayPlan.topics,
                reviewTopics: dayPlan.reviewTopics || [],
                totalHours: dayPlan.totalHours,
                completed: false
            };
        });

        // Create study plan
        const studyPlan = new StudyPlan({
            user: userId,
            course: courseId,
            examDate: exam,
            schedule,
            metadata: {
                totalDays: daysUntilExam,
                hoursPerDay: hoursPerDay || 4,
                studentLevel: studentLevel || 'intermediate',
                dependencies: dependencies,
                studyTips: aiPlan.studyTips || [],
                examStrategy: aiPlan.examStrategy || ''
            },
            status: 'active'
        });

        await studyPlan.save();

        res.status(201).json({
            message: 'Study plan generated successfully',
            studyPlan
        });

    } catch (error) {
        console.error('Error generating study plan:', error);
        res.status(500).json({
            message: 'Failed to generate study plan',
            error: error.message
        });
    }
};

/**
 * Get active study plan for a course
 * GET /api/study-plans/:courseId
 */
exports.getStudyPlan = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const studyPlan = await StudyPlan.getActivePlan(userId, courseId);

        if (!studyPlan) {
            return res.status(404).json({ message: 'No active study plan found for this course' });
        }

        // Get today's tasks
        const todayTasks = studyPlan.getTodayTasks();

        // Calculate progress
        const progress = studyPlan.progress;

        res.json({
            studyPlan,
            todayTasks,
            progress,
            isBehind: studyPlan.isBehindSchedule()
        });

    } catch (error) {
        console.error('Error fetching study plan:', error);
        res.status(500).json({ message: 'Failed to fetch study plan', error: error.message });
    }
};

/**
 * Update topic completion and confidence
 * PUT /api/study-plans/:id/complete-topic
 */
exports.completeTopicAndRate = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, topicName, confidence, note } = req.body;
        const userId = req.user.id;

        const studyPlan = await StudyPlan.findById(id);

        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found' });
        }

        if (studyPlan.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find and update the topic
        const daySchedule = studyPlan.schedule.find(d => d.day === day);
        if (!daySchedule) {
            return res.status(404).json({ message: 'Day not found in schedule' });
        }

        const topic = daySchedule.topics.find(t => t.name === topicName);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        topic.completed = true;
        topic.completedAt = new Date();
        if (confidence) {
            topic.confidence = confidence;
        }

        // Check if entire day is completed
        daySchedule.completed = daySchedule.topics.every(t => t.completed);

        await studyPlan.save();

        // Track confidence in separate collection
        if (confidence) {
            let confidenceTracking = await ConfidenceTracking.findOne({
                user: userId,
                course: studyPlan.course,
                topic: topicName
            });

            if (!confidenceTracking) {
                confidenceTracking = new ConfidenceTracking({
                    user: userId,
                    course: studyPlan.course,
                    studyPlan: studyPlan._id,
                    topic: topicName
                });
            }

            await confidenceTracking.addRating(confidence, note || '', 'after_learning');
        }

        res.json({
            message: 'Topic marked as complete',
            studyPlan,
            needsReview: confidence && confidence < 3
        });

    } catch (error) {
        console.error('Error completing topic:', error);
        res.status(500).json({ message: 'Failed to complete topic', error: error.message });
    }
};

/**
 * Trigger adaptive replanning
 * PUT /api/study-plans/:id/replan
 */
exports.adaptiveReplan = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const studyPlan = await StudyPlan.findById(id).populate('course');

        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found' });
        }

        if (studyPlan.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Calculate remaining days
        const today = new Date();
        const exam = new Date(studyPlan.examDate);
        const daysRemaining = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 0) {
            return res.status(400).json({ message: 'Exam has already passed' });
        }

        // Gather current progress
        const currentProgress = [];
        for (const day of studyPlan.schedule) {
            for (const topic of day.topics) {
                currentProgress.push({
                    topic: topic.name,
                    completed: topic.completed,
                    confidence: topic.confidence || 0
                });
            }
        }

        // Get AI suggestions for replanning
        console.log('Getting adaptive plan suggestions...');
        const adaptivePlan = await perplexityService.suggestAdaptivePlan(
            studyPlan,
            currentProgress,
            daysRemaining
        );

        // Update metadata
        studyPlan.metadata.lastReplanned = new Date();
        studyPlan.metadata.replanCount = (studyPlan.metadata.replanCount || 0) + 1;

        await studyPlan.save();

        res.json({
            message: 'Adaptive plan suggestions generated',
            suggestions: adaptivePlan,
            currentProgress: {
                daysRemaining,
                completed: currentProgress.filter(p => p.completed).length,
                total: currentProgress.length
            }
        });

    } catch (error) {
        console.error('Error generating adaptive plan:', error);
        res.status(500).json({ message: 'Failed to generate adaptive plan', error: error.message });
    }
};

/**
 * Get spaced repetition review schedule
 * GET /api/study-plans/:id/review-schedule
 */
exports.getReviewSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const studyPlan = await StudyPlan.findById(id);

        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found' });
        }

        if (studyPlan.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Gather completed topics with dates
        const topicsLearned = [];
        for (const day of studyPlan.schedule) {
            for (const topic of day.topics) {
                if (topic.completed) {
                    topicsLearned.push({
                        name: topic.name,
                        learnedDate: topic.completedAt || day.date
                    });
                }
            }
        }

        if (topicsLearned.length === 0) {
            return res.json({
                message: 'No topics completed yet',
                reviewSchedule: []
            });
        }

        // Get AI-generated spaced repetition schedule
        const schedule = await perplexityService.getSpacedRepetitionSchedule(
            topicsLearned,
            studyPlan.examDate
        );

        res.json({
            message: 'Review schedule generated',
            reviewSchedule: schedule.reviewSchedule
        });

    } catch (error) {
        console.error('Error generating review schedule:', error);
        res.status(500).json({ message: 'Failed to generate review schedule', error: error.message });
    }
};

/**
 * Get confidence tracking for all topics
 * GET /api/study-plans/:courseId/confidence
 */
exports.getConfidenceTracking = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const confidenceData = await ConfidenceTracking.find({
            user: userId,
            course: courseId
        }).sort({ currentConfidence: 1 });

        const lowConfidenceTopics = confidenceData.filter(c => c.currentConfidence < 3);

        res.json({
            allTopics: confidenceData,
            lowConfidenceTopics,
            needsReview: lowConfidenceTopics.length
        });

    } catch (error) {
        console.error('Error fetching confidence data:', error);
        res.status(500).json({ message: 'Failed to fetch confidence data', error: error.message });
    }
};
