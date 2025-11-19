const form = document.getElementById('loginForm');
const msg = document.getElementById('message');

form.addEventListener('submit', async e => {
  e.preventDefault();
  msg.textContent = "⏳ Connexion en cours...";

  const data = {
    email: document.getElementById('email').value,
    mot_de_passe: document.getElementById('mot_de_passe').value,
  };

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (res.ok) {
      localStorage.setItem('token', result.token);
      msg.textContent = "✅ Connexion réussie ! Redirection...";
      setTimeout(() => window.location.href = 'profile.html', 1500);
    } else {
      msg.textContent = "⚠️ " + (result.error || "Erreur inconnue");
    }
  } catch {
    msg.textContent = "🚨 Impossible de contacter le serveur";
  }
});
