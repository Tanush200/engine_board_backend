const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    professor: { type: String, default: '' },
    semester: { type: String, default: '' },
    color: { type: String, default: '#3B82F6' },
    syllabus: [{
        topic: { type: String, required: true },
        completed: { type: Boolean, default: false }
    }],
    resources: [{
        title: { type: String, required: true },
        link: { type: String, required: true },
        type: { type: String, default: 'Link' }
    }],
    attendance: {
        attended: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);