const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ================= SYSTEM PROMPT ================= */
const SYSTEM_PROMPT = {
  role: "system",
  content: `
You are PlacementAI, a professional career guidance and placement assistant.

Strict rules:
- Answer ONLY career, jobs, placements, skills, resumes, interviews
- Use clear headings and bullet points
- Keep responses structured and concise
- Provide practical, actionable advice
- Avoid emojis
- Do NOT mention that you are an AI model
- Maintain conversation context naturally
- End with a short helpful follow-up question
`
};

/* ================= AI RESPONSE WITH TIMEOUT + MEMORY ================= */
async function getPlacementAIResponse(conversation) {
  try {
    // 🛡️ Safety: ensure array
    if (!Array.isArray(conversation)) {
      conversation = [{ role: "user", content: String(conversation) }];
    }

    // 🧠 Limit memory (prevents freezing)
    const trimmedConversation = conversation.slice(-8);

    // ⏱️ HARD TIMEOUT (10 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const completion = await groq.chat.completions.create(
      {
        model: "llama-3.1-8b-instant",
        messages: [SYSTEM_PROMPT, ...trimmedConversation],
        temperature: 0.25,
        max_tokens: 500
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Groq API timeout/error:", error.message);
    return "⚠️ I’m taking longer than usual to respond. Please try again.";
  }
}

module.exports = { getPlacementAIResponse };
