// backend/routes/ai.js
import express from "express";
import {
  reformulateText,
  enhanceText,
  generatePlan,
  generateIdeas,
  writingAssistant,
} from "../services/openaiService.js";

const router = express.Router();

// Middleware d'authentification
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  next();
};

/* ---------------------------------------------------------
   POST /api/ai/reformulate
   Reformulation IA
--------------------------------------------------------- */
router.post("/reformulate", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "")
      return res.status(400).json({ error: "Texte requis" });

    const result = await reformulateText(text);
    res.json({ text: result });
  } catch (err) {
    console.error("❌ Reformulate Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------
   POST /api/ai/enhance
   Enrichissement IA
--------------------------------------------------------- */
router.post("/enhance", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "")
      return res.status(400).json({ error: "Texte requis" });

    const result = await enhanceText(text);
    res.json({ text: result });
  } catch (err) {
    console.error("❌ Enhance Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------
   POST /api/ai/plan
   Génération de plan
--------------------------------------------------------- */
router.post("/plan", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "")
      return res.status(400).json({ error: "Texte requis" });

    const result = await generatePlan(text);
    res.json({ text: result });
  } catch (err) {
    console.error("❌ Plan Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------
   POST /api/ai/ideas
   Génération d’idées
--------------------------------------------------------- */
router.post("/ideas", requireAuth, async (req, res) => {
  try {
    const { genre, summary } = req.body;
    if (!genre || !summary)
      return res.status(400).json({ error: "Genre et résumé requis" });

    const result = await generateIdeas(genre, summary);
    res.json({ text: result });
  } catch (err) {
    console.error("❌ Ideas Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------
   POST /api/ai/writing-assistant
   Assistant d’écriture
--------------------------------------------------------- */
router.post("/writing-assistant", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "")
      return res.status(400).json({ error: "Texte requis" });

    const result = await writingAssistant(text);
    res.json({ text: result });
  } catch (err) {
    console.error("❌ Writing Assistant Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
