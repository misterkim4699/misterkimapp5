// backend/routes/api/ai/improve.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();

// --- Initialisation OpenAI ---
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// --- IA Locale (fallback) ---
function localAI(prompt) {
  return `
[IA locale active]
Tu as demandé :
"${prompt}"

Comme l'API OpenAI est indisponible ou le quota est dépassé,
une réponse générée localement a été fournie.`;
}

// --- Appel intelligent (OpenAI → fallback) ---
async function smartAI(systemMessage, userMessage) {
  const prompt = `${systemMessage}\n${userMessage}`;

  // Pas de clé → IA locale
  if (!openai) {
    return { text: localAI(prompt), engine: "local-no-key" };
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      max_tokens: 300,
    });

    return {
      text: response.choices[0].message.content,
      engine: "openai",
    };

  } catch (err) {
    console.warn("⚠️ API OpenAI indisponible → fallback IA locale:", err.message);
    return { text: localAI(prompt), engine: "fallback-local" };
  }
}

// ---------------- ROUTES ------------------

// Reformuler
router.post("/reformulate", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Texte requis." });

  const result = await smartAI(
    "Reformule et améliore la clarté du texte suivant :",
    text
  );

  res.json(result);
});

// Enrichir
router.post("/enhance", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Texte requis." });

  const result = await smartAI(
    "Améliore ce texte en ajoutant style et précision :",
    text
  );

  res.json(result);
});

// Plan
router.post("/plan", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Texte requis." });

  const result = await smartAI(
    "Crée un plan détaillé et structuré pour ce contenu :",
    text
  );

  res.json(result);
});

// Idées
router.post("/idea", async (req, res) => {
  const { genre, summary } = req.body;
  if (!summary) return res.status(400).json({ error: "Résumé requis." });

  const result = await smartAI(
    `Propose des idées pour un ${genre || "texte"} basé sur le résumé :`,
    summary
  );

  res.json(result);
});

// Assistant d’écriture
router.post("/writing-assistant", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Texte requis." });

  const result = await smartAI(
    "Fournis des corrections, améliorations et suggestions créatives pour ce texte :",
    text
  );

  res.json(result);
});

// Route standard /improve
router.post("/improve", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Texte requis." });

  const result = await smartAI("Améliore ce texte :", text);

  res.json(result);
});

export default router;