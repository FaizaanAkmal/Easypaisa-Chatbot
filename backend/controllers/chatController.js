import Chat from '../models/chat.js';
import mongoose from 'mongoose';
import dotenv from "dotenv"

dotenv.config();

class ChatController {
    // Get all chats for a user
    static async getUserChats(req, res) {
        try {
            const { userEmail } = req.params;

            if (!userEmail) {
                return res.status(400).json({ error: 'User email is required' });
            }

            const chats = await Chat.findByUser(userEmail);

            // Transform data for frontend
            const transformedChats = chats.map(chat => ({
                id: chat.id,
                sessionId: chat.sessionId,
                title: chat.title,
                createdAt: chat.createdAt,
                lastMessage: chat.lastMessage
            }));

            // Get messages for each chat (only message metadata, not full content)
            const messagesMap = {};
            chats.forEach(chat => {
                messagesMap[chat.id] = chat.messages.map(msg => ({
                    id: msg.id,
                    text: msg.text,
                    isUser: msg.isUser,
                    timestamp: msg.timestamp,
                    isError: msg.isError,
                    sourceDocuments: msg.sourceDocuments
                }));
            });

            res.json({
                chats: transformedChats,
                messages: messagesMap
            });
        } catch (error) {
            console.error('Error fetching user chats:', error);
            res.status(500).json({ error: 'Failed to fetch chats' });
        }
    }

    // Create a new chat
    static async createChat(req, res) {
        try {
            const { userEmail, chatData } = req.body;

            if (!userEmail || !chatData) {
                return res.status(400).json({ error: 'User email and chat data are required' });
            }

            const newChat = new Chat({
                id: chatData.id,
                sessionId: chatData.sessionId,
                title: chatData.title || 'New Chat',
                userEmail: userEmail,
                createdAt: chatData.createdAt ? new Date(chatData.createdAt) : new Date(),
                lastMessage: chatData.lastMessage,
                messages: []
            });

            await newChat.save();

            res.status(201).json({
                success: true,
                chat: {
                    id: newChat.id,
                    sessionId: newChat.sessionId,
                    title: newChat.title,
                    createdAt: newChat.createdAt,
                    lastMessage: newChat.lastMessage
                }
            });
        } catch (error) {
            console.error('Error creating chat:', error);
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Chat already exists' });
            }
            res.status(500).json({ error: 'Failed to create chat' });
        }
    }

    // Add message to a chat
    static async addMessage(req, res) {
        try {
            const { userEmail, chatId } = req.params;
            const { messageData } = req.body;

            if (!userEmail || !chatId || !messageData) {
                return res.status(400).json({ error: 'User email, chat ID, and message data are required' });
            }

            const chat = await Chat.findByUserAndId(userEmail, chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            // Add message to chat
            await chat.addMessage({
                id: messageData.id,
                text: messageData.text,
                isUser: messageData.isUser,
                timestamp: messageData.timestamp ? new Date(messageData.timestamp) : new Date(),
                isError: messageData.isError || false,
                sourceDocuments: messageData.sourceDocuments || []
            });

            // Update title if it's the first user message
            if (messageData.isUser && chat.messages.length === 1) {
                await chat.updateTitle(messageData.text);
            }

            res.json({
                success: true,
                message: 'Message added successfully',
                lastMessage: chat.lastMessage
            });
        } catch (error) {
            console.error('Error adding message:', error);
            res.status(500).json({ error: 'Failed to add message' });
        }
    }

    // Update chat (title, etc.)
    static async updateChat(req, res) {
        try {
            const { userEmail, chatId } = req.params;
            const updates = req.body;

            if (!userEmail || !chatId) {
                return res.status(400).json({ error: 'User email and chat ID are required' });
            }

            const chat = await Chat.findByUserAndId(userEmail, chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            // Update allowed fields
            if (updates.title !== undefined) {
                chat.title = updates.title;
            }
            if (updates.lastMessage !== undefined) {
                chat.lastMessage = updates.lastMessage;
            }

            await chat.save();

            res.json({
                success: true,
                chat: {
                    id: chat.id,
                    sessionId: chat.sessionId,
                    title: chat.title,
                    createdAt: chat.createdAt,
                    lastMessage: chat.lastMessage
                }
            });
        } catch (error) {
            console.error('Error updating chat:', error);
            res.status(500).json({ error: 'Failed to update chat' });
        }
    }

    // Delete a chat
    static async deleteChat(req, res) {
        try {
            const { userEmail, chatId } = req.params;

            if (!userEmail || !chatId) {
                return res.status(400).json({ error: 'User email and chat ID are required' });
            }

            const result = await Chat.deleteOne({ userEmail, id: chatId });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            res.json({
                success: true,
                message: 'Chat deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting chat:', error);
            res.status(500).json({ error: 'Failed to delete chat' });
        }
    }

    // Bulk save chats and messages (for syncing)
    static async bulkSave(req, res) {
        try {
            const { userEmail, chats, messages } = req.body;

            if (!userEmail || !chats || !messages) {
                return res.status(400).json({ error: 'User email, chats, and messages are required' });
            }

            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Delete existing chats for user
                await Chat.deleteMany({ userEmail }, { session });

                // Create new chats with messages
                const chatDocuments = chats.map(chat => ({
                    id: chat.id,
                    sessionId: chat.sessionId,
                    title: chat.title,
                    userEmail: userEmail,
                    createdAt: new Date(chat.createdAt),
                    lastMessage: chat.lastMessage,
                    messages: (messages[chat.id] || []).map(msg => ({
                        id: msg.id,
                        text: msg.text,
                        isUser: msg.isUser,
                        timestamp: new Date(msg.timestamp),
                        isError: msg.isError || false,
                        sourceDocuments: msg.sourceDocuments || []
                    }))
                }));

                await Chat.insertMany(chatDocuments, { session });
                await session.commitTransaction();

                res.json({
                    success: true,
                    message: 'Chats and messages saved successfully',
                    count: chatDocuments.length
                });
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        } catch (error) {
            console.error('Error bulk saving:', error);
            res.status(500).json({ error: 'Failed to save chats and messages' });
        }
    }

    // Get messages for a specific chat
    static async getChatMessages(req, res) {
        try {
            const { userEmail, chatId } = req.params;

            if (!userEmail || !chatId) {
                return res.status(400).json({ error: 'User email and chat ID are required' });
            }

            const chat = await Chat.findByUserAndId(userEmail, chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            const messages = chat.messages.map(msg => ({
                id: msg.id,
                text: msg.text,
                isUser: msg.isUser,
                timestamp: msg.timestamp,
                isError: msg.isError,
                sourceDocuments: msg.sourceDocuments
            }));

            res.json({
                success: true,
                messages: messages
            });
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    }

    static async getPrediction(req, res) {
        try {
            const { question, chatId } = req.body; // use body, not params
            const history = req.body.history || [];

            const response = await fetch(`http://localhost:3000/api/v1/prediction/${process.env.FLOWISE_API_HOST}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    chatId,
                    history,
                    overrideConfig: {} // can leave empty for now
                })
            });

            const data = await response.json();

            res.json(data);
        }
        catch (error) {
            console.error('Error fetching chat messages:', error);
            res.status(500).json({ error: error.message });
        }
    }

}

export default ChatController;