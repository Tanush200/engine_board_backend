const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, default: 'Assignment' },
    status: { type: String, default: 'Todo' },
    priority: { type: String, default: 'Medium' },
    githubRepo: { type: String, default: '' },
    deadline: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    estimatedTime: { type: Number, default: 120 },
    actualTime: { type: Number },
    aiGenerated: { type: Boolean, default: false },
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    subtasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    createdAt: { type: Date, default: Date.now() }
});

module.exports = mongoose.model('Task', taskSchema);
