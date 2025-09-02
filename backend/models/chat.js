import mongoose from "mongoose";

// Message Schema
const messageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    isUser: {
        type: Boolean,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isError: {
        type: Boolean,
        default: false
    },
    sourceDocuments: [{
        pageContent: String,
        metadata: {
            source: String,
            // Add other metadata fields as needed
            type: mongoose.Schema.Types.Mixed
        }
    }]
});

// Chat Schema
const chatSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    sessionId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        default: 'New Chat'
    },
    userEmail: {
        type: String,
        required: true,
        index: true // Index for faster queries by user
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastMessage: {
        type: String,
        default: null
    },
    messages: [messageSchema]
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for better performance
chatSchema.index({ userEmail: 1, createdAt: -1 });
chatSchema.index({ id: 1, userEmail: 1 });

// Instance methods
chatSchema.methods.addMessage = function(messageData) {
    this.messages.push(messageData);
    this.lastMessage = messageData.text.substring(0, 50) + (messageData.text.length > 50 ? '...' : '');
    return this.save();
};

chatSchema.methods.updateTitle = function(newTitle) {
    if (this.title === 'New Chat') {
        this.title = newTitle.substring(0, 30) + (newTitle.length > 30 ? '...' : '');
        return this.save();
    }
    return Promise.resolve(this);
};

// Static methods
chatSchema.statics.findByUser = function(userEmail) {
    return this.find({ userEmail }).sort({ createdAt: -1 });
};

chatSchema.statics.findByUserAndId = function(userEmail, chatId) {
    return this.findOne({ userEmail, id: chatId });
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;