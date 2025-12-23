const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        contextUsed: {
            tasksAnalyzed: [{
                type: String
            }],
            coursesConsidered: [{
                type: String
            }]
        }
    }],
    lastActive: {
        type: Date,
        default: Date.now
    },
    messageCount: {
        type: Number,
        default: 0
    },
    todayMessageCount: {
        type: Number,
        default: 0
    },
    lastMessageDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
chatMessageSchema.index({ user: 1, lastActive: -1 });

// Method to add a message
chatMessageSchema.methods.addMessage = function (role, content, contextUsed = {}) {
    this.messages.push({
        role,
        content,
        timestamp: new Date(),
        contextUsed
    });

    this.lastActive = new Date();
    this.messageCount += 1;

    // Reset daily count if new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = this.lastMessageDate ? new Date(this.lastMessageDate) : null;

    if (!lastDate || lastDate < today) {
        this.todayMessageCount = 1;
    } else {
        this.todayMessageCount += 1;
    }

    this.lastMessageDate = new Date();

    return this.save();
};

// Method to get conversation history
chatMessageSchema.methods.getConversation = function (limit = 20) {
    return this.messages.slice(-limit);
};

// Method to check daily limit
chatMessageSchema.methods.hasReachedDailyLimit = function (limit = 50) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = this.lastMessageDate ? new Date(this.lastMessageDate) : null;

    if (!lastDate || lastDate < today) {
        return false; // New day, reset
    }

    return this.todayMessageCount >= limit;
};

// Static method to get or create chat for user
chatMessageSchema.statics.getOrCreateChat = async function (userId) {
    let chat = await this.findOne({ user: userId });

    if (!chat) {
        chat = new this({ user: userId, messages: [] });
        await chat.save();
    }

    return chat;
};

// Static method to clear old messages (keep last 50)
chatMessageSchema.statics.cleanupOldMessages = async function (userId) {
    const chat = await this.findOne({ user: userId });

    if (chat && chat.messages.length > 50) {
        chat.messages = chat.messages.slice(-50);
        await chat.save();
    }
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
