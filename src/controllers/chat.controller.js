const { Chat } = require("../models/Chat.model");
const User = require("../models/User.model");

const getChatMessages = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.result._id; // From userMiddleware

    // Find or create chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "userName profileImage",
    });

    if (!chat) {
      // Create a new empty chat if it doesn't exist
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }

    res.status(200).json({
      success: true,
      chat: chat,
    });
  } catch (err) {
    console.error("Error fetching chat:", err);
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch chat messages" });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.result._id;

    // Find all chats where the user is a participant
    const chats = await Chat.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "userName profileImage role",
      })
      .populate({
        path: "messages.senderId",
        select: "userName",
      })
      .sort({ updatedAt: -1 }); // Most recent chats first

    // Process chats to get unique conversations with last message
    const chatHistory = chats.map((chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      
      const lastMessage = chat.messages[chat.messages.length - 1] || null;

      return {
        _id: chat._id,
        participant: otherParticipant,
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              sender: lastMessage.senderId?.userName || "Unknown",
              createdAt: lastMessage.createdAt,
            }
          : null,
        messageCount: chat.messages.length,
        updatedAt: chat.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      chats: chatHistory,
    });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch chat history" });
  }
};

module.exports = { getChatMessages, getChatHistory };

