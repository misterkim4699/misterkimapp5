// public/app.js

const apiBase = "/api/projects"; // Base API pour les projets
const authBase = "/api/auth"; // Base API pour l'authentification

/* ---------------------------------------------------------
   Notifications
--------------------------------------------------------- */
function showNotification(message, type = "info") {
  const notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

/* ---------------------------------------------------------
   Authentification
--------------------------------------------------------- */
async function login(email, password) {
  try {
    const res = await fetch(`${authBase}/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      showNotification("Connexion réussie !", "success");
      window.location.href = "/dashboard.html";
    } else {
      showNotification(data.error || "Erreur connexion", "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("Erreur connexion", "error");
  }
}

async function logout() {
  try {
    const res = await fetch(`${authBase}/logout`, {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) {
      showNotification(data.message || "Déconnexion réussie", "success");
      window.location.href = "/index.html";
    }
  } catch (err) {
    console.error(err);
    showNotification("Erreur déconnexion", "error");
  }
}

/* ---------------------------------------------------------
   Gestion des projets
--------------------------------------------------------- */
async function fetchProjects() {
  try {
    const res = await fetch(apiBase, { credentials: "include" });
    const data = await res.json();
    if (res.ok) {
      renderProjects(data.projects);
    } else {
      showNotification(data.error || "Erreur récupération projets", "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("Impossible de récupérer les projets", "error");
  }
}

function renderProjects(projects) {
  const container = document.getElementById("projects-container");
  if (!container) return;

  container.innerHTML = "";

  if (!projects || projects.length === 0) {
    container.innerHTML = `<p>Aucun projet pour le moment.</p>`;
    return;
  }

  projects.forEach((project) => {
    const div = document.createElement("div");
    div.className = "project-card";
    div.innerHTML = `
      <h3>${project.title}</h3>
      <p>${project.description || ""}</p>
      <div class="actions">
        <button class="edit-btn" data-id="${project.id}">✏️ Modifier</button>
        <button class="delete-btn" data-id="${project.id}">🗑️ Supprimer</button>
      </div>
    `;
    container.appendChild(div);
  });

  // Événements modification
  document
    .querySelectorAll(".edit-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () => editProjectPrompt(btn.dataset.id))
    );

  // Événements suppression
  document
    .querySelectorAll(".delete-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () => deleteProject(btn.dataset.id))
    );
}

/* Création */
async function createProject(title, description) {
  try {
    const res = await fetch(apiBase, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json();
    if (res.ok) {
      showNotification("Projet créé !", "success");
      fetchProjects();
    } else {
      showNotification(data.error, "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("Erreur création projet", "error");
  }
}

/* Modification */
async function updateProject(id, title, description) {
  try {
    const res = await fetch(`${apiBase}/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json();
    if (res.ok) {
      showNotification("Projet mis à jour !", "success");
      fetchProjects();
    } else {
      showNotification(data.error, "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("Erreur mise à jour projet", "error");
  }
}

function editProjectPrompt(id) {
  const title = prompt("Nouveau titre du projet :");
  const description = prompt("Nouvelle description :");
  if (title) updateProject(id, title, description);
}

/* Suppression */
async function deleteProject(id) {
  if (!confirm("Voulez-vous vraiment supprimer ce projet ?")) return;
  try {
    const res = await fetch(`${apiBase}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) {
      showNotification("Projet supprimé !", "success");
      fetchProjects();
    } else {
      showNotification(data.error, "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("Erreur suppression projet", "error");
  }
}

/* ---------------------------------------------------------
   Formulaires
--------------------------------------------------------- */
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    login(email, password);
  });
}

const createProjectForm = document.getElementById("create-project-form");
if (createProjectForm) {
  createProjectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = e.target.title.value.trim();
    const description = e.target.description.value.trim();
    if (title) {
      createProject(title, description);
      e.target.reset();
    } else {
      showNotification("Le titre est requis", "warning");
    }
  });
}

/* ---------------------------------------------------------
   Initialisation
--------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  fetchProjects();
});
