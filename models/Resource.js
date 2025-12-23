const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    tags: [{
        type: String
    }],
    category: {
        type: String,
        required: true,
        enum: ['Computer Science', 'Mathematics', 'Electronics', 'Mechanical', 'Civil', 'General Engineering', 'Physics', 'Chemistry']
    },
    thumbnail: {
        type: String, // URL to channel logo or thumbnail
        default: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'
    },
    // Enhanced fields for study plans
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    estimatedTime: {
        type: Number, // in minutes
        default: 30
    },
    resourceType: {
        type: String,
        enum: ['video', 'pdf', 'article', 'practice', 'other'],
        default: 'video'
    },
    syllabusTopics: [{
        type: String // Tags to match with course syllabus
    }],
    examFocused: {
        type: Boolean,
        default: false
    },
    quickRevision: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Resource', resourceSchema);
