const express = require("express");
const chatRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const { getChatMessages, getChatHistory } = require("../controllers/chat.controller");

// Get chat messages for a specific user
chatRouter.get("/chat/:targetUserId", userMiddleware, getChatMessages);

// Get all chat history for the current user
chatRouter.get("/chat", userMiddleware, getChatHistory);

module.exports = chatRouter;

