const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    professor: { type: String, default: '' },
    semester: { type: String, default: '' },
    color: { type: String, default: '#3B82F6' },

    // Syllabus tracking
    syllabus: [{
        topic: { type: String, required: true },
        completed: { type: Boolean, default: false }
    }],

    // Resources (notes, books, links)
    resources: [{
        title: { type: String, required: true },
        link: { type: String, required: true },
        type: { type: String, default: 'Link' }
    }],

    // Attendance tracking
    attendance: {
        attended: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);