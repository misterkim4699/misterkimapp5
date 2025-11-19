// backend/routes/ai.js
import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const router = express.Router();

// Middleware d'authentification
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  next();
};

// Initialisation OpenAI (API v4 / 2024+)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------------------------------------------------
   POST /api/ai/generate
   Génération de texte IA
--------------------------------------------------------- */
router.post("/generate", requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Le prompt est requis." });
    }

    // Utilisation du modèle moderne gpt-4o-mini (rapide, peu coûteux)
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const output = response.choices[0].message?.content;

    res.json({
      text: output || "",
    });
  } catch (err) {
    console.error("❌ Erreur IA:", err);

    // Erreur spécifique OpenAI
    if (err.response) {
      return res.status(err.response.status).json({
        error: "Erreur API OpenAI",
        details: err.response.data,
      });
    }

    res.status(500).json({ error: "Erreur interne IA" });
  }
});

export default router;

