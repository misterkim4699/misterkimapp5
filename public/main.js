// public/main.js
const apiBase =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";

/* ========= TOAST ========= */
function showToast(text, type = "info", timeout = 3000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    Object.assign(container.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    });
    document.body.appendChild(container);
  }

  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = `
    padding: 12px 18px;
    border-radius: 10px;
    color: white;
    background: ${
      type === "success" ? "#27ae60" : type === "error" ? "#e74c3c" : "#2980b9"
    };
    font-weight: 600;
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    transition: opacity .3s;
  `;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, timeout);
}

/* ========= LOGIN ========= */
(function () {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value.trim(); // IMPORTANT

    if (!email || !password) {
      showToast("Email et mot de passe requis.", "error");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }), // IMPORTANT
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Erreur de connexion.", "error");
        return;
      }

      showToast("Connexion réussie !", "success");

      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
    } catch (err) {
      console.error(err);
      showToast("Impossible de contacter le serveur.", "error");
    }
  });
})();

/* ========= REGISTER ========= */
(function () {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nom = form.nom.value.trim();
    const prenom = form.prenom.value.trim();
    const email = form.email.value.trim();
    const username = form.username.value.trim();
    const password = form.password.value.trim(); // IMPORTANT

    if (!nom || !prenom || !email || !password) {
      showToast("Tous les champs obligatoires doivent être remplis.", "error");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nom,
          prenom,
          email,
          username,
          password, // IMPORTANT
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Erreur lors d'inscription.", "error");
        return;
      }

      showToast("Inscription réussie ! Vous pouvez vous connecter.", "success");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 600);
    } catch (err) {
      console.error(err);
      showToast("Impossible de contacter le serveur.", "error");
    }
  });
})();
