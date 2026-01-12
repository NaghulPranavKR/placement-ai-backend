const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const { getPlacementAIResponse } = require("../services/aiService");

/* CREATE NEW CHAT */
router.post("/new", auth, async (req, res) => {
  const chat = await Chat.create({
    user: req.user.id,
    title: "New Chat"
  });
  res.json(chat);
});

/* GET ALL CHATS */
router.get("/", auth, async (req, res) => {
  const chats = await Chat.find({ user: req.user.id })
    .sort({ updatedAt: -1 });
  res.json(chats);
});

/* GET MESSAGES */
router.get("/:chatId/messages", auth, async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .sort({ createdAt: 1 });
  res.json(messages);
});

/* SEND MESSAGE — SAFE + MEMORY + TIMEOUT */
router.post("/:chatId/message", auth, async (req, res) => {
  const { text } = req.body;
  const { chatId } = req.params;

  // 1️⃣ Save user message
  await Message.create({
    chat: chatId,
    sender: "user",
    text
  });

  // 2️⃣ Fetch limited memory (VERY IMPORTANT for free tier)
  const history = await Message.find({ chat: chatId })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  const conversation = history
    .reverse()
    .map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text.slice(0, 800)
    }));

  let aiReply;

  try {
    // ⏱ HARD BACKEND TIMEOUT (10s)
    aiReply = await Promise.race([
      getPlacementAIResponse(conversation),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI_LIMIT")), 10000)
      )
    ]);
  } catch {
    aiReply =
      "⚠️ **Chat limit reached**\n\n" +
      "This conversation has reached its maximum limit.\n\n" +
      "👉 **Start a new chat to continue**";
  }

  // 3️⃣ Save AI reply
  await Message.create({
    chat: chatId,
    sender: "bot",
    text: aiReply
  });

  // 4️⃣ Set title only once
  const chat = await Chat.findById(chatId);
  if (chat && chat.title === "New Chat") {
    await Chat.findByIdAndUpdate(chatId, {
      title: text.slice(0, 30)
    });
  }

  res.json({ answer: aiReply });
});

/* RENAME CHAT */
router.put("/:chatId/rename", auth, async (req, res) => {
  const { title } = req.body;
  const chat = await Chat.findOneAndUpdate(
    { _id: req.params.chatId, user: req.user.id },
    { title },
    { new: true }
  );
  res.json(chat);
});

/* DELETE CHAT */
router.delete("/:chatId", auth, async (req, res) => {
  await Message.deleteMany({ chat: req.params.chatId });
  await Chat.findOneAndDelete({
    _id: req.params.chatId,
    user: req.user.id
  });
  res.json({ message: "Chat deleted successfully" });
});

module.exports = router;
