const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true
    },
    sender: {
      type: String,
      enum: ["user", "bot"],
      required: true
    },
    text: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
