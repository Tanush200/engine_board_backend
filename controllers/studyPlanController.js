const StudyPlan = require('../models/StudyPlan');
const ConfidenceTracking = require('../models/ConfidenceTracking');
const Course = require('../models/Course');
const Resource = require('../models/Resource');
const perplexityService = require('../services/perplexityService');


exports.generateStudyPlan = async (req, res) => {
    try {
        const { courseId, examDate, hoursPerDay, studentLevel } = req.body;
        const userId = req.user.id;


        if (!courseId || !examDate) {
            return res.status(400).json({ message: 'Course ID and exam date are required' });
        }

        const exam = new Date(examDate);
        if (exam <= new Date()) {
            return res.status(400).json({ message: 'Exam date must be in the future' });
        }


        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }


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

        console.log('Generating topic dependencies...');
        const syllabusTopics = course.syllabus.map(s => s.topic);
        const dependencies = await perplexityService.generateTopicDependencies(
            course.name,
            syllabusTopics
        );

        console.log('Generating study plan...');
        const aiPlan = await perplexityService.generateStudyPlan(
            course,
            examDate,
            studentLevel || 'intermediate',
            hoursPerDay || 4
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntilExam = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

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


exports.getStudyPlan = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const studyPlan = await StudyPlan.getActivePlan(userId, courseId);

        if (!studyPlan) {
            return res.status(404).json({ message: 'No active study plan found for this course' });
        }

        const todayTasks = studyPlan.getTodayTasks();

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

        daySchedule.completed = daySchedule.topics.every(t => t.completed);

        await studyPlan.save();

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

        const today = new Date();
        const exam = new Date(studyPlan.examDate);
        const daysRemaining = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 0) {
            return res.status(400).json({ message: 'Exam has already passed' });
        }

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

        console.log('Getting adaptive plan suggestions...');
        const adaptivePlan = await perplexityService.suggestAdaptivePlan(
            studyPlan,
            currentProgress,
            daysRemaining
        );

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


exports.addCollaborator = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        const userId = req.user.id;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const studyPlan = await StudyPlan.findById(id);

        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found' });
        }

        if (studyPlan.user.toString() !== userId) {
            return res.status(403).json({ message: 'Only the owner can add collaborators' });
        }


        const User = require('../models/User');
        const collaborator = await User.findOne({ email });

        if (!collaborator) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        if (collaborator._id.toString() === userId) {
            return res.status(400).json({ message: 'You cannot add yourself as a collaborator' });
        }

        if (studyPlan.collaborators.includes(collaborator._id)) {
            return res.status(400).json({ message: 'User is already a collaborator' });
        }

        studyPlan.collaborators.push(collaborator._id);
        await studyPlan.save();

        await studyPlan.populate('collaborators', 'name email color');

        const emailService = require('../services/emailService');
        const inviter = await User.findById(userId);
        const planLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/exam-prep`;

        await emailService.sendInvitationEmail(
            collaborator.email,
            inviter.name,
            planLink
        );

        res.json({
            message: 'Collaborator added successfully',
            collaborators: studyPlan.collaborators
        });

    } catch (error) {
        console.error('Error adding collaborator:', error);
        res.status(500).json({ message: 'Failed to add collaborator', error: error.message });
    }
};


exports.getLatestActivePlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const plan = await StudyPlan.findOne({
            $or: [
                { user: userId },
                { collaborators: userId }
            ],
            status: 'active'
        })
            .sort({ lastUpdated: -1 })
            .populate('course')
            .populate('collaborators', 'name email');

        if (!plan) return res.status(404).json({ message: 'No active plan found' });

        res.json(plan);
    } catch (error) {
        console.error('Error fetching latest plan:', error);
        res.status(500).json({ message: 'Failed to fetch latest plan', error: error.message });
    }
};
