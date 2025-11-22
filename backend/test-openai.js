import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // ✅ Remplacé GPT-4 par GPT-3.5
      messages: [
        { role: "system", content: "Tu es un assistant utile et concis." },
        {
          role: "user",
          content:
            "Bonjour, peux-tu me confirmer que ma clé OpenAI fonctionne ?",
        },
      ],
      temperature: 0,
      max_tokens: 50,
    });

    console.log("✅ OpenAI fonctionne !");
    console.log("Réponse OpenAI :", response.choices?.[0]?.message?.content);
  } catch (err) {
    console.error("❌ Erreur OpenAI :", err.message || err);
    if (err.code === "insufficient_quota") {
      console.error("🔹 Attention : quota dépassé ou plan non suffisant !");
    } else if (err.code === "invalid_api_key") {
      console.error("🔹 Clé API invalide !");
    }
  }
}

testOpenAI();
