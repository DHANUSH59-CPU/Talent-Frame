const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/Chat.model");
const User = require("../models/User.model");

// Generate a unique, consistent room ID for a pair of users
const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId.toString(), targetUserId.toString()].sort().join("$"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(`${firstName} joined Room: ${roomId}`);
      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, userId, targetUserId, text }) => {
        try {
          // Validate that both users exist
          const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(targetUserId),
          ]);

          if (!user || !targetUser) {
            socket.emit("messageError", {
              error: "One or both users not found",
            });
            return;
          }

          // Validate message content
          if (!text || text.trim().length === 0) {
            socket.emit("messageError", { error: "Message cannot be empty" });
            return;
          }

          if (text.length > 1000) {
            socket.emit("messageError", {
              error: "Message too long (max 1000 characters)",
            });
            return;
          }

          const roomId = getSecretRoomId(userId, targetUserId);

          // Find or create chat
          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          // Add message to chat
          chat.messages.push({
            senderId: userId,
            text: text.trim(),
          });

          await chat.save();

          // Broadcast message to all users in the room
          io.to(roomId).emit("messageReceived", {
            firstName,
            lastName,
            text: text.trim(),
          });

          console.log(`Message sent in room: ${roomId}`);
        } catch (err) {
          console.error("Socket message error:", err);
          socket.emit("messageError", {
            error: "Failed to send message",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;

