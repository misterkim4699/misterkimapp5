// public/main.js
const apiBase =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";

/* -----------------------
   Helpers UI
------------------------*/
function showToast(text, type = "info", timeout = 3000) {
  const containerId = "misterkim-toast-container";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
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

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -----------------------
   LOGIN
------------------------*/
(function setupLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const loginMsg = document.getElementById("login-msg");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginMsg) loginMsg.textContent = "";

    const email = (loginForm.querySelector("#email") || {}).value?.trim() || "";
    const password =
      (loginForm.querySelector("#password") || {}).value?.trim() || "";

    if (!email || !password) {
      if (loginMsg) {
        loginMsg.textContent = "Email et mot de passe requis.";
        loginMsg.style.color = "red";
      }
      showToast("Email et mot de passe requis", "error");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        if (loginMsg) {
          loginMsg.textContent = "Connexion réussie — redirection...";
          loginMsg.style.color = "green";
        }
        showToast("Connexion réussie", "success");
        setTimeout(() => (window.location.href = "dashboard.html"), 700);
      } else {
        if (loginMsg) {
          loginMsg.textContent = data?.error || "Erreur de connexion.";
          loginMsg.style.color = "red";
        }
        showToast(data?.error || "Erreur de connexion", "error");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (loginMsg) {
        loginMsg.textContent = "Impossible de contacter le serveur.";
        loginMsg.style.color = "red";
      }
      showToast("Impossible de contacter le serveur", "error");
    }
  });
})();

/* -----------------------
   REGISTER
------------------------*/
(function setupRegister() {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  const registerMsg = document.getElementById("register-msg");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (registerMsg) registerMsg.textContent = "";

    const prenom =
      (registerForm.querySelector("#prenom") || {}).value?.trim() || "";
    const nom = (registerForm.querySelector("#nom") || {}).value?.trim() || "";
    const email =
      (registerForm.querySelector("#email") || {}).value?.trim() || "";
    const username =
      (registerForm.querySelector("#username") || {}).value?.trim() || "";
    const password =
      (registerForm.querySelector("#password") || {}).value?.trim() || "";

    if (!prenom || !nom || !email || !password) {
      if (registerMsg) {
        registerMsg.textContent = "Veuillez remplir tous les champs requis.";
        registerMsg.style.color = "red";
      }
      showToast("Veuillez remplir tous les champs requis", "error");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prenom, nom, email, username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        if (registerMsg) {
          registerMsg.textContent =
            "Inscription réussie. Vérifiez votre email.";
          registerMsg.style.color = "green";
        }
        showToast(
          "Inscription réussie, vérifiez votre email pour activer le compte",
          "success"
        );
      } else {
        if (registerMsg) {
          registerMsg.textContent =
            data?.error || "Erreur lors de l'inscription.";
          registerMsg.style.color = "red";
        }
        showToast(data?.error || "Erreur lors de l'inscription", "error");
      }
    } catch (err) {
      console.error("Register error:", err);
      if (registerMsg) {
        registerMsg.textContent = "Impossible de contacter le serveur.";
        registerMsg.style.color = "red";
      }
      showToast("Impossible de contacter le serveur", "error");
    }
  });
})();

/* -----------------------
   DASHBOARD / PROJECTS
------------------------*/
async function loadProjects() {
  const container = document.getElementById("projects-container");
  if (!container) return;

  container.innerHTML = `<div class="card">Chargement des projets...</div>`;

  try {
    const res = await fetch(`${apiBase}/projects`, { credentials: "include" });
    const data = await res.json();

    if (!res.ok) {
      container.innerHTML = `<div class="card">Erreur: ${
        data?.error || "Impossible de charger"
      }</div>`;
      showToast(
        data?.error || "Erreur lors du chargement des projets",
        "error"
      );
      return;
    }

    const projects = Array.isArray(data.projects) ? data.projects : [];
    if (projects.length === 0) {
      container.innerHTML = `<div class="card">Aucun projet pour le moment. Créez-en un !</div>`;
      return;
    }

    container.innerHTML = "";
    projects.forEach((p) => {
      const card = document.createElement("div");
      card.className = "project-card";
      card.innerHTML = `
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description || "")}</p>
        <div class="project-actions">
          <button class="btn-edit" data-id="${p.id}">✏️</button>
          <button class="btn-delete" data-id="${p.id}">🗑️</button>
        </div>
      `;
      container.appendChild(card);
    });

    container
      .querySelectorAll(".btn-delete")
      .forEach((btn) =>
        btn.addEventListener("click", () => deleteProject(btn.dataset.id))
      );
    container
      .querySelectorAll(".btn-edit")
      .forEach((btn) =>
        btn.addEventListener("click", () => editProjectPrompt(btn.dataset.id))
      );
  } catch (err) {
    console.error("loadProjects error:", err);
    container.innerHTML = `<div class="card">Erreur lors du chargement des projets.</div>`;
    showToast("Erreur réseau lors du chargement des projets", "error");
  }
}

/* -----------------------
   LOGOUT
------------------------*/
(function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch(`${apiBase}/auth/logout`, { credentials: "include" });
    } catch (err) {
      console.warn("Logout failed:", err);
    } finally {
      window.location.href = "index.html";
    }
  });
})();

/* -----------------------
   Auto init
------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("projects-container")) loadProjects();

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        window.scrollTo({ top: target.offsetTop - 70, behavior: "smooth" });
      }
    });
  });

  // Scroll effect navbar
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) {
      if (window.scrollY > 60) nav.classList.add("nav-scrolled");
      else nav.classList.remove("nav-scrolled");
    }
  });
});
