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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Resource', resourceSchema);
