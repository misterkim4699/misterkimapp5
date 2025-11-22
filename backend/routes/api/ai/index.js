// backend/routes/api/ai/index.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();

// --- OpenAI client (optionnel selon la présence de la clé) ---
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// --- Fallback local simple (retourne un texte mock) ---
function localAI(prompt) {
  return (
    "MODE IA LOCALE — réponse mock.\n\n" +
    "Votre prompt :\n" +
    prompt +
    "\n\n( Ceci est une réponse générée localement car l'API OpenAI n'est pas disponible.)"
  );
}

// --- helper qui appelle OpenAI et mappe la sortie vers la clé attendue ---
async function callOpenAIAndMap({ type, prompt }) {
  // system prompts par type pour guider la génération
  const systemPrompts = {
    reformulate: "Tu es un assistant qui reformule les textes en améliorant le style et la clarté.",
    enhance: "Tu es un assistant qui enrichit et améliore les textes en ajoutant style et précision.",
    plan: "Tu es un assistant qui crée un plan structuré pour un texte ou un article.",
    idea: "Tu es un assistant créatif qui propose des idées basées sur un résumé donné.",
    "writing-assistant": "Tu es un assistant d'écriture qui propose corrections, améliorations et suggestions."
  };

  const systemMessage = systemPrompts[type] || "Tu es un assistant utile.";

  // 1) si pas de clé OpenAI → fallback local
  if (!openai) {
    // renvoie l'objet attendu selon type
    const text = localAI(prompt);
    switch (type) {
      case "reformulate": return { reformulated: text, engine: "local" };
      case "enhance": return { enhanced: text, engine: "local" };
      case "plan": return { plan: text, engine: "local" };
      case "idea": return { ideas: text, engine: "local" };
      case "writing-assistant": return { suggestions: text, engine: "local" };
      default: return { improved: text, engine: "local" };
    }
  }

  // 2) appel OpenAI
  try {
    // Utilise model depuis env ou fallback
    const model = process.env.OPENAI_MODEL || "gpt-4";

    // Certains SDKs récents utilisent responses API ; ici on essaye la méthode chat.completions.create
    // (adapté à ta version existante). Si erreur, on retourne fallback local ci-dessous.
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 700,
    });

    const text = response?.choices?.[0]?.message?.content?.trim() || "";

    switch (type) {
      case "reformulate": return { reformulated: text, engine: "openai" };
      case "enhance": return { enhanced: text, engine: "openai" };
      case "plan": return { plan: text, engine: "openai" };
      case "idea": return { ideas: text, engine: "openai" };
      case "writing-assistant": return { suggestions: text, engine: "openai" };
      default: return { improved: text, engine: "openai" };
    }
  } catch (err) {
    // Log complet pour debug
    console.warn("⚠️ API OpenAI indisponible → fallback IA locale:", err?.message || err);
    // fallback local
    const text = localAI(prompt);
    switch (type) {
      case "reformulate": return { reformulated: text, engine: "local-fallback" };
      case "enhance": return { enhanced: text, engine: "local-fallback" };
      case "plan": return { plan: text, engine: "local-fallback" };
      case "idea": return { ideas: text, engine: "local-fallback" };
      case "writing-assistant": return { suggestions: text, engine: "local-fallback" };
      default: return { improved: text, engine: "local-fallback" };
    }
  }
}

// Routes (chaque route renvoie exactement la clé attendue par le front)
router.post("/reformulate", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Le texte est requis." });
  try {
    const result = await callOpenAIAndMap({ type: "reformulate", prompt: text });
    res.json(result);
  } catch (err) {
    console.error("Erreur /reformulate :", err);
    res.status(500).json({ error: "Impossible de traiter la demande." });
  }
});

router.post("/enhance", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Le texte est requis." });
  try {
    const result = await callOpenAIAndMap({ type: "enhance", prompt: text });
    res.json(result);
  } catch (err) {
    console.error("Erreur /enhance :", err);
    res.status(500).json({ error: "Impossible de traiter la demande." });
  }
});

router.post("/plan", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Le texte est requis pour générer un plan." });
  try {
    const result = await callOpenAIAndMap({ type: "plan", prompt: text });
    res.json(result);
  } catch (err) {
    console.error("Erreur /plan :", err);
    res.status(500).json({ error: "Impossible de traiter la demande." });
  }
});

router.post("/idea", async (req, res) => {
  const { genre, summary } = req.body;
  if (!summary || !String(summary).trim()) return res.status(400).json({ error: "Résumé requis pour générer des idées." });
  try {
    const prompt = `Genre: ${genre || "texte" }\nRésumé: ${summary}`;
    const result = await callOpenAIAndMap({ type: "idea", prompt });
    res.json(result);
  } catch (err) {
    console.error("Erreur /idea :", err);
    res.status(500).json({ error: "Impossible de traiter la demande." });
  }
});

router.post("/writing-assistant", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Le texte est requis pour l'assistant." });
  try {
    const result = await callOpenAIAndMap({ type: "writing-assistant", prompt: text });
    res.json(result);
  } catch (err) {
    console.error("Erreur /writing-assistant :", err);
    res.status(500).json({ error: "Impossible de traiter la demande." });
  }
});

// Endpoint unique legacy /improve (optionnel) -> renvoie { improved }
router.post("/improve", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Champ 'text' requis." });
  try {
    const result = await callOpenAIAndMap({ type: "reformulate", prompt: text });
    // map to generic improved
    const improved = result.reformulated || result.enhanced || result.plan || result.ideas || result.suggestions || result.improved;
    res.json({ success: true, improved, engine: result.engine });
  } catch (err) {
    console.error("Erreur /improve :", err);
    res.status(500).json({ error: "Erreur interne IA." });
  }
});

export default router;