// Load environment variables
require("dotenv").config();

// Core packages
const express = require("express");
const cors = require("cors");

// DB connection
const connectDB = require("./config/db");

// AI service
const { getPlacementAIResponse } = require("./services/aiService");

// Routes
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

/* =========================
   CONNECT DATABASE
   ========================= */
connectDB();

/* =========================
   MIDDLEWARES
   ========================= */
app.use(cors({
  origin: "*"
}));
app.use(express.json());

/* =========================
   ROOT ROUTE (IMPORTANT)
   ========================= */
app.get("/", (req, res) => {
  res.send("🚀 Placement AI Backend is Live!");
});

/* =========================
   ROUTES
   ========================= */
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

/* =========================
   AI ASK ROUTE
   ========================= */
app.post("/ask", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const aiReply = await getPlacementAIResponse(message);

    res.json({
      question: message,
      answer: aiReply
    });
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: "AI response failed" });
  }
});

/* =========================
   SERVER START (RENDER SAFE)
   ========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Placement AI Server running on port ${PORT}`);
});
