// backend/routes/api/ai/improve.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();

// Assurez-vous que la variable d'environnement OPENAI_API_KEY est définie
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route POST pour améliorer un texte
router.post("/improve", async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Le texte est requis." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant qui améliore le style et la clarté des textes.",
        },
        {
          role: "user",
          content: `Améliore le texte suivant :\n\n${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const improvedText = response.choices?.[0]?.message?.content || "";
    res.json({ improvedText });
  } catch (error) {
    console.error("Erreur OpenAI:", error);
    res.status(500).json({ error: "Impossible de traiter la demande." });
  }
});

export default router;
