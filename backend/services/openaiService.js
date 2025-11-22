// backend/services/openaiService.js
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Initialisation OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Appel générique à OpenAI
 * @param {string} prompt - Le prompt à envoyer
 * @param {string} model - Modèle à utiliser
 * @param {number} maxTokens - Nombre max de tokens
 * @param {number} temperature - Paramètre de créativité
 * @returns {Promise<string>}
 */
export async function generateText(prompt, model = "gpt-4o-mini", maxTokens = 1500, temperature = 0.7) {
  if (!prompt || prompt.trim() === "") {
    throw new Error("Le prompt est requis pour générer du texte.");
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    return response.choices[0].message?.content || "";
  } catch (error) {
    console.error("❌ Erreur OpenAI Service:", error);

    if (error.response) {
      throw new Error(`Erreur API OpenAI: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error("Erreur interne OpenAI Service");
  }
}

/**
 * Fonctions spécialisées pour ton assistant romancier
 */

export async function reformulateText(text) {
  const prompt = `Reformule ce texte de manière claire, fluide et naturelle:\n\n${text}`;
  return await generateText(prompt);
}

export async function enhanceText(text) {
  const prompt = `Améliore ce texte avec plus de détails, dialogues et émotions:\n\n${text}`;
  return await generateText(prompt);
}

export async function generatePlan(text) {
  const prompt = `Génère un plan structuré pour ce texte:\n\n${text}`;
  return await generateText(prompt);
}

export async function generateIdeas(genre, summary) {
  const prompt = `Propose des idées pour un roman de genre "${genre}" basé sur ce résumé:\n\n${summary}`;
  return await generateText(prompt);
}

export async function writingAssistant(text) {
  const prompt = `Agis comme un assistant d’écriture et propose comment continuer ou améliorer ce texte:\n\n${text}`;
  return await generateText(prompt);
}