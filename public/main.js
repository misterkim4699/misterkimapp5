// public/main.js
const apiBase =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";

/* ================== TOAST ================== */
function showToast(text, type = "info", timeout = 3000) {
  let container = document.getElementById("misterkim-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "misterkim-toast-container";
    Object.assign(container.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    });
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.textContent = text;
  el.className = `toast ${type}`;
  Object.assign(el.style, {
    padding: "10px 14px",
    borderRadius: "8px",
    color: "#fff",
    background:
      type === "success"
        ? "#2ecc71"
        : type === "error"
        ? "#e74c3c"
        : type === "warning"
        ? "#f39c12"
        : "#3498db",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    fontWeight: 600,
    fontSize: "14px",
    opacity: "1",
    transition: "opacity 300ms",
  });
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, timeout);
}

/* ================== ESCAPE HTML ================== */
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ================== LOGIN ================== */
(function setupLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;
  const loginMsg = document.getElementById("login-msg");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginMsg) loginMsg.textContent = "";
    const email = (loginForm.querySelector("#email") || {}).value?.trim();
    const password = (loginForm.querySelector("#password") || {}).value?.trim();
    if (!email || !password) {
      if (loginMsg) loginMsg.textContent = "Email et mot de passe requis.";
      showToast("Email et mot de passe requis", "error");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, mot_de_passe: password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("utilisateur", JSON.stringify(data.utilisateur));
        if (loginMsg)
          loginMsg.textContent = "Connexion réussie — redirection...";
        showToast("Connexion réussie", "success");
        setTimeout(() => (window.location.href = "profile.html"), 700);
      } else {
        if (loginMsg)
          loginMsg.textContent = data?.error || "Erreur de connexion.";
        showToast(data?.error || "Erreur de connexion", "error");
      }
    } catch (err) {
      console.error(err);
      if (loginMsg)
        loginMsg.textContent = "Impossible de contacter le serveur.";
      showToast("Impossible de contacter le serveur", "error");
    }
  });
})();

/* ================== REGISTER ================== */
(function setupRegister() {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;
  const registerMsg = document.getElementById("register-msg");
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (registerMsg) registerMsg.textContent = "";
    const prenom = (registerForm.querySelector("#prenom") || {}).value?.trim();
    const nom = (registerForm.querySelector("#nom") || {}).value?.trim();
    const email = (registerForm.querySelector("#email") || {}).value?.trim();
    const username = (
      registerForm.querySelector("#username") || {}
    ).value?.trim();
    const password = (
      registerForm.querySelector("#password") || {}
    ).value?.trim();

    if (!prenom || !nom || !email || !password) {
      if (registerMsg)
        registerMsg.textContent = "Veuillez remplir tous les champs requis.";
      showToast("Veuillez remplir tous les champs requis", "error");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prenom,
          nom,
          email,
          username,
          mot_de_passe: password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (registerMsg)
          registerMsg.textContent =
            "Inscription réussie. Vérifiez votre email.";
        showToast("Inscription réussie, vérifiez votre email", "success");
        setTimeout(() => (window.location.href = "login.html"), 1200);
      } else {
        if (registerMsg)
          registerMsg.textContent =
            data?.error || "Erreur lors de l'inscription.";
        showToast(data?.error || "Erreur lors de l'inscription", "error");
      }
    } catch (err) {
      console.error(err);
      if (registerMsg)
        registerMsg.textContent = "Impossible de contacter le serveur.";
      showToast("Impossible de contacter le serveur", "error");
    }
  });
})();

/* ================== LOGOUT ================== */
(function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch(`${apiBase}/auth/logout`, { credentials: "include" });
    } catch (err) {
      console.warn("Logout failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("utilisateur");
      window.location.href = "index.html";
    }
  });
})();

/* ================== PROFILE ================== */
(function loadProfile() {
  const infoEl = document.getElementById("user-info");
  if (!infoEl) return;
  const utilisateur = localStorage.getItem("utilisateur");
  if (!utilisateur) {
    infoEl.textContent = "Aucun utilisateur connecté.";
    return;
  }
  const user = JSON.parse(utilisateur);
  infoEl.innerHTML = `
    <strong>Nom :</strong> ${escapeHtml(user.nom)}<br>
    <strong>Prénom :</strong> ${escapeHtml(user.prenom)}<br>
    <strong>Email :</strong> ${escapeHtml(user.email)}<br>
    <strong>Username :</strong> ${escapeHtml(user.username || "")}
  `;
})();

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", () => {
  // Smooth scroll pour les ancres
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target)
        window.scrollTo({ top: target.offsetTop - 70, behavior: "smooth" });
    });
  });

  // Navbar scroll effect
  const nav = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (!nav) return;
    if (window.scrollY > 60) nav.classList.add("nav-scrolled");
    else nav.classList.remove("nav-scrolled");
  });
});
