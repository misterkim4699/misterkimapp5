/* Dashboard.js - amélioré & sécurisé
   - Initialise au DOMContentLoaded
   - Toasts, confirmations, calculs mots, badges, accessibilité
*/

(function () {
  // -- Helpers LocalStorage
  function getProjects() {
    return JSON.parse(localStorage.getItem("projects") || "[]");
  }
  function saveProjects(p) {
    localStorage.setItem("projects", JSON.stringify(p));
  }
  function generateId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "_" + Math.random().toString(36).slice(2, 9);
  }

  // -- Toast
  const toastEl = { el: null, timer: null };
  function initToast() {
    toastEl.el = document.getElementById("toast");
  }
  function showToast(msg, ms = 2200) {
    if (!toastEl.el) return console.warn("Toast absent");
    toastEl.el.textContent = msg;
    toastEl.el.classList.add("show");
    clearTimeout(toastEl.timer);
    toastEl.timer = setTimeout(() => toastEl.el.classList.remove("show"), ms);
  }

  // -- DOM refs (safely)
  let projectsGrid, newProjectModal, activeProjectModal, profileModal;
  let projectForm, cancelNewProjectBtn, newProjectBtn, openNewProjectBtn;
  let saveProjectBtn, aiProjectBtn, aiEnhanceBtn, closeProjectBtns;

  function cacheElements() {
    projectsGrid = document.querySelector(".projects-grid");
    newProjectModal = document.getElementById("newProjectModal");
    activeProjectModal = document.getElementById("activeProjectModal");
    profileModal = document.getElementById("profileModal");
    projectForm = document.getElementById("projectForm");
    cancelNewProjectBtn = document.getElementById("cancelNewProject");
    newProjectBtn = document.getElementById("newProjectBtn");
    openNewProjectBtn = document.getElementById("openNewProjectBtn");
    saveProjectBtn = document.getElementById("saveProject");
    aiProjectBtn = document.getElementById("aiProjectBtn");
    aiEnhanceBtn = document.getElementById("aiEnhance");
    closeProjectBtns = document.querySelectorAll(".close-project");
  }

  // -- Statistics
  function recomputeStats() {
    const projects = getProjects();
    const statProjects = document.getElementById("statProjects");
    const statWords = document.getElementById("statWords");
    const statSuccess = document.getElementById("statSuccess");

    statProjects && (statProjects.innerText = projects.length);
    const totalWords = projects.reduce((s, p) => s + (p.words || 0), 0);
    statWords && (statWords.innerText = totalWords);
    // define success as number of 'termine' projects
    const successCount = projects.filter((p) => p.status === "termine").length;
    statSuccess && (statSuccess.innerText = successCount);
  }

  // -- Render
  function renderProjects() {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = "";
    const projects = getProjects().sort((a, b) => b.createdAt - a.createdAt);

    projects.forEach((p) => {
      const card = document.createElement("article");
      card.className = "project-card";
      card.setAttribute("data-id", p.id);
      const dateStr = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : "--/--/----";
      const words = p.words || 0;
      const status = p.status || "brouillon";

      card.innerHTML = `
        <div>
          <h3>${escapeHtml(p.title || "Sans titre")}</h3>
          <span class="project-badge ${
            status === "termine" ? "termine" : "brouillon"
          }">${status === "termine" ? "Terminé" : "Brouillon"}</span>
          <p>${escapeHtml(p.description || "")}</p>
        </div>

        <div>
          <div class="project-indicators">
            <span>📝 ${words} mots</span>
            <span>📅 ${dateStr}</span>
          </div>
          <div class="project-actions">
            <button class="open-project" data-id="${
              p.id
            }" aria-label="Ouvrir ${escapeHtml(
        p.title || "projet"
      )}">Ouvrir</button>
            <button class="delete-project" data-id="${
              p.id
            }" aria-label="Supprimer ${escapeHtml(
        p.title || "projet"
      )}">Supprimer</button>
          </div>
        </div>
      `;
      projectsGrid.appendChild(card);
    });

    attachProjectEvents();
    recomputeStats();
  }

  // -- Events (delegation)
  function attachProjectEvents() {
    projectsGrid
      .querySelectorAll(".open-project")
      .forEach((btn) => btn.removeEventListener("click", openProjectHandler));
    projectsGrid
      .querySelectorAll(".delete-project")
      .forEach((btn) => btn.removeEventListener("click", deleteProjectHandler));

    projectsGrid
      .querySelectorAll(".open-project")
      .forEach((btn) => btn.addEventListener("click", openProjectHandler));
    projectsGrid
      .querySelectorAll(".delete-project")
      .forEach((btn) => btn.addEventListener("click", deleteProjectHandler));
  }

  function openProjectHandler(e) {
    const id = e.currentTarget.dataset.id;
    openProject(id);
  }

  function deleteProjectHandler(e) {
    const id = e.currentTarget.dataset.id;
    if (!confirm("Confirmer la suppression de ce projet ?")) return;
    deleteProject(id);
    showToast("Projet supprimé");
  }

  // -- Open / Delete / Save
  function openProject(id) {
    const projects = getProjects();
    const p = projects.find((x) => x.id === id);
    if (!p) return showToast("Projet introuvable");

    const modal = document.getElementById("activeProjectModal");
    const textarea = document.getElementById("activeProjectTextarea");
    const statusEl = document.getElementById("activeProjectStatus");
    const activeDate = document.getElementById("activeDate");
    const activeWords = document.getElementById("activeWords");

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    modal.dataset.id = id;
    textarea.value = p.content || p.description || "";
    statusEl.textContent = p.status === "termine" ? "Terminé" : "Brouillon";
    statusEl.className =
      "project-badge " + (p.status === "termine" ? "termine" : "brouillon");
    activeDate.textContent = p.createdAt
      ? new Date(p.createdAt).toLocaleDateString()
      : "--/--/----";
    activeWords.textContent = (p.words || 0) + " mots";

    textarea.focus();
  }

  function saveProjectFromModal() {
    const modal = document.getElementById("activeProjectModal");
    const id = modal.dataset.id;
    const textarea = document.getElementById("activeProjectTextarea");
    const text = textarea.value || "";
    const projects = getProjects();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1)
      return showToast("Impossible d'enregistrer : projet introuvable");

    projects[idx].content = text;
    projects[idx].words = countWords(text);
    saveProjects(projects);
    renderProjects();
    showToast("Projet enregistré");
  }

  function deleteProject(id) {
    const projects = getProjects().filter((p) => p.id !== id);
    saveProjects(projects);
    renderProjects();
  }

  // -- New project flow
  function openNewProjectModal() {
    newProjectModal.style.display = "flex";
    newProjectModal.setAttribute("aria-hidden", "false");
    const firstInput = newProjectModal.querySelector("input, textarea, select");
    firstInput && firstInput.focus();
  }
  function closeNewProjectModal() {
    newProjectModal.style.display = "none";
    newProjectModal.setAttribute("aria-hidden", "true");
  }
  function submitNewProject(e) {
    e.preventDefault();
    const title = (e.target.title.value || "").trim();
    const description = (e.target.description.value || "").trim();
    if (!title) return showToast("Titre requis");

    const projects = getProjects();
    const newP = {
      id: generateId(),
      title,
      description,
      content: "",
      status: "brouillon",
      words: 0,
      createdAt: Date.now(),
    };
    projects.push(newP);
    saveProjects(projects);
    renderProjects();
    closeNewProjectModal();
    showToast("Projet créé");
    e.target.reset();
  }

  // -- AI placeholder: simulate improvement with tiny delay
  function toggleAISection() {
    const aiSection = document.getElementById("aiSection");
    aiSection.style.display =
      aiSection.style.display === "none" ? "block" : "none";
  }
  function applyAIEnhance() {
    const aiInput = document.getElementById("aiInput");
    const text = (aiInput.value || "").trim();
    if (!text) return showToast("Entrez un texte à améliorer");
    // simulate async IA processing
    showToast("Amélioration IA en cours...");
    setTimeout(() => {
      const modalTextarea = document.getElementById("activeProjectTextarea");
      // very simple enhancement: sentence case + trim multiplespaces
      const enhanced = text
        .replace(/\s+/g, " ")
        .replace(/(^\w|\.\s+\w)/g, (c) => c.toUpperCase());
      modalTextarea.value =
        (modalTextarea.value ? modalTextarea.value + "\n\n" : "") + enhanced;
      aiInput.value = "";
      showToast("Texte amélioré (simulation)");
    }, 700);
  }

  // -- Utilities
  function countWords(s) {
    return (s || "").trim().split(/\s+/).filter(Boolean).length;
  }
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // -- Close overlay on click outside & Esc key
  function attachOverlayClose() {
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (ev) => {
        if (ev.target === overlay) {
          overlay.style.display = "none";
          overlay.setAttribute("aria-hidden", "true");
        }
      });
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        document.querySelectorAll(".modal-overlay").forEach((o) => {
          if (o.style.display === "flex") {
            o.style.display = "none";
            o.setAttribute("aria-hidden", "true");
          }
        });
      }
    });
  }

  // -- Logout
  function attachLogout() {
    const btn = document.getElementById("btnLogout");
    if (!btn) return;
    btn.addEventListener("click", () => {
      localStorage.removeItem("token");
      showToast("Déconnecté");
      setTimeout(() => (window.location.href = "login.html"), 600);
    });
  }

  // -- Escape hatch: seed sample project if empty (optional)
  function seedIfEmpty() {
    const projects = getProjects();
    if (projects.length === 0) {
      const demo = [
        {
          id: generateId(),
          title: "Les Chroniques de Jupiter",
          description: "Un récit épique entre étoiles et révolutions.",
          content: "",
          status: "brouillon",
          words: 320,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
        },
        {
          id: generateId(),
          title: "Recueil de contes",
          description: "Courtes histoires pour longues nuits.",
          content: "",
          status: "termine",
          words: 12000,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
        },
      ];
      saveProjects(demo);
    }
  }

  // -- Init
  function init() {
    initToast();
    cacheElements();
    attachLogout();
    attachOverlayClose();

    // wire buttons & forms
    newProjectBtn?.addEventListener("click", openNewProjectModal);
    openNewProjectBtn?.addEventListener("click", openNewProjectModal);
    cancelNewProjectBtn?.addEventListener("click", closeNewProjectModal);
    projectForm?.addEventListener("submit", submitNewProject);
    saveProjectBtn?.addEventListener("click", saveProjectFromModal);
    aiProjectBtn?.addEventListener("click", toggleAISection);
    aiEnhanceBtn?.addEventListener("click", applyAIEnhance);
    document.getElementById("openProfileBtn")?.addEventListener("click", () => {
      profileModal.style.display = "flex";
      profileModal.setAttribute("aria-hidden", "false");
    });
    document
      .getElementById("closeProfileModal")
      ?.addEventListener("click", () => {
        profileModal.style.display = "none";
        profileModal.setAttribute("aria-hidden", "true");
      });

    // close project buttons
    document.querySelectorAll(".close-project").forEach((b) =>
      b.addEventListener("click", () => {
        activeProjectModal.style.display = "none";
        activeProjectModal.setAttribute("aria-hidden", "true");
      })
    );

    // seed & render
    seedIfEmpty();
    renderProjects();
  }

  // Start when DOM loaded
  document.addEventListener("DOMContentLoaded", init);

  // expose nothing to global scope
})();
