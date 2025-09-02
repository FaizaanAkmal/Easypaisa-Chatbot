import express from "express"
import ChatController from "../controllers/chatController.js";

const router = express.Router();

// GET /api/chats/:userEmail - Get all chats for a user
router.get('/:userEmail', ChatController.getUserChats);

// POST /api/chats - Create a new chat
router.post('/', ChatController.createChat);

// PUT /api/chats/:userEmail/:chatId - Update a chat
router.put('/:userEmail/:chatId', ChatController.updateChat);

// DELETE /api/chats/:userEmail/:chatId - Delete a chat
router.delete('/:userEmail/:chatId', ChatController.deleteChat);

// POST /api/chats/:userEmail/:chatId/messages - Add a message to a chat
router.post('/:userEmail/:chatId/messages', ChatController.addMessage);

// GET /api/chats/:userEmail/:chatId/messages - Get messages for a specific chat
router.get('/:userEmail/:chatId/messages', ChatController.getChatMessages);

// POST /api/chats/bulk-save - Bulk save chats and messages (for syncing)
router.post('/bulk-save', ChatController.bulkSave);

export default router;