const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    examDate: {
        type: Date,
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },

    schedule: [{
        day: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        topics: [{
            name: {
                type: String,
                required: true
            },
            syllabusTopicId: {
                type: String // reference to course.syllabus array item
            },
            hoursAllocated: {
                type: Number,
                required: true
            },
            difficulty: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced'],
                default: 'intermediate'
            },
            goalDescription: {
                type: String
            },
            resources: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Resource'
            }],
            completed: {
                type: Boolean,
                default: false
            },
            completedAt: {
                type: Date
            },
            confidence: {
                type: Number,
                min: 1,
                max: 5,
                default: null
            }
        }],
        reviewTopics: [{
            type: String
        }],
        totalHours: {
            type: Number,
            required: true
        },
        completed: {
            type: Boolean,
            default: false
        }
    }],

    metadata: {
        totalDays: {
            type: Number
        },
        hoursPerDay: {
            type: Number
        },
        studentLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'intermediate'
        },
        dependencies: {
            type: Map,
            of: mongoose.Schema.Types.Mixed // Stores AI-generated topic dependencies
        },
        studyTips: [{
            type: String
        }],
        examStrategy: {
            type: String
        },
        lastReplanned: {
            type: Date
        },
        replanCount: {
            type: Number,
            default: 0
        }
    },

    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned', 'replanned'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index for efficient queries
studyPlanSchema.index({ user: 1, course: 1, status: 1 });
studyPlanSchema.index({ examDate: 1 });

// Virtual to calculate overall progress
studyPlanSchema.virtual('progress').get(function () {
    const totalTopics = this.schedule.reduce((sum, day) => sum + day.topics.length, 0);
    const completedTopics = this.schedule.reduce((sum, day) =>
        sum + day.topics.filter(t => t.completed).length, 0
    );
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
});

// Method to get current day's tasks
studyPlanSchema.methods.getTodayTasks = function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.schedule.find(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
    });
};

// Method to check if student is behind schedule
studyPlanSchema.methods.isBehindSchedule = function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let shouldBeCompleted = 0;
    let actuallyCompleted = 0;

    for (const day of this.schedule) {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);

        if (dayDate < today) {
            shouldBeCompleted += day.topics.length;
            actuallyCompleted += day.topics.filter(t => t.completed).length;
        }
    }

    return actuallyCompleted < (shouldBeCompleted * 0.7); // Behind if less than 70% complete
};

// Static method to get active plan for a course
studyPlanSchema.statics.getActivePlan = function (userId, courseId) {
    return this.findOne({
        user: userId,
        course: courseId,
        status: 'active'
    }).populate('course').populate('schedule.topics.resources');
};

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
