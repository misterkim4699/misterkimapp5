const form = document.getElementById("registerForm");
const msg = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "⏳ Envoi en cours...";

  const data = {
    nom: document.getElementById("nom").value,
    prenom: document.getElementById("prenom").value,
    email: document.getElementById("email").value,
    mot_de_passe: document.getElementById("mot_de_passe").value
  };

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (res.ok) {
      msg.textContent = "✅ Inscription réussie ! Redirection...";
      setTimeout(() => window.location.href = "login.html", 1500);
    } else {
      msg.textContent = "⚠️ " + (result.error || "Erreur inconnue");
    }
  } catch (err) {
    msg.textContent = "🚨 Impossible de contacter le serveur";
  }
});