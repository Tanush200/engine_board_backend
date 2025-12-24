const mongoose = require('mongoose');

const confidenceTrackingSchema = new mongoose.Schema({
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
    studyPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyPlan'
    },
    topic: {
        type: String,
        required: true
    },

    confidenceHistory: [{
        score: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: {
            type: String
        },
        context: {
            type: String, // 'after_learning', 'after_practice', 'before_exam', etc.
        }
    }],

    currentConfidence: {
        type: Number,
        min: 1,
        max: 5
    },

    needsReview: {
        type: Boolean,
        default: false
    },

    lastReviewed: {
        type: Date
    },

    reviewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

confidenceTrackingSchema.index({ user: 1, course: 1, topic: 1 }, { unique: true });

confidenceTrackingSchema.methods.addRating = function (score, note = '', context = 'general') {
    this.confidenceHistory.push({
        score,
        note,
        context,
        timestamp: new Date()
    });

    this.currentConfidence = score;
    this.needsReview = score < 3;

    return this.save();
};

confidenceTrackingSchema.methods.getTrend = function () {
    if (this.confidenceHistory.length < 2) return 'insufficient_data';

    const recent = this.confidenceHistory.slice(-3);
    const scores = recent.map(h => h.score);

    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];

    if (lastScore > firstScore) return 'improving';
    if (lastScore < firstScore) return 'declining';
    return 'stable';
};

confidenceTrackingSchema.statics.getLowConfidenceTopics = function (userId, courseId) {
    return this.find({
        user: userId,
        course: courseId,
        currentConfidence: { $lt: 3 }
    }).sort({ currentConfidence: 1 });
};

confidenceTrackingSchema.statics.getTopicsNeedingReview = function (userId, courseId) {
    return this.find({
        user: userId,
        course: courseId,
        needsReview: true
    });
};

module.exports = mongoose.model('ConfidenceTracking', confidenceTrackingSchema);
