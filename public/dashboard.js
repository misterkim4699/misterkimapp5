/* public/dashboard.js - Version complète & compatible avec fallback IA */
(function () {
  // ---------- Helpers LocalStorage ----------
  function getProjects() {
    return JSON.parse(localStorage.getItem("projects") || "[]");
  }
  function saveProjects(p) {
    localStorage.setItem("projects", JSON.stringify(p));
  }
  function generateId() {
    if (window.crypto && window.crypto.randomUUID)
      return window.crypto.randomUUID();
    return "_" + Math.random().toString(36).slice(2, 9);
  }

  // ---------- Toast ----------
  const toast = { el: null, timer: null };
  function initToast() {
    toast.el = document.getElementById("toast");
  }
  function showToast(msg, ms = 2000) {
    if (!toast.el) return;
    toast.el.textContent = msg;
    toast.el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toast.el.classList.remove("show"), ms);
  }

  // ---------- Cache éléments ----------
  let projectsGrid;
  let newProjectModal, activeProjectModal, profileModal;
  let projectForm, cancelNewProjectBtn, newProjectBtn, openNewProjectBtn;
  let saveProjectBtn, deleteProjectBtn, openProfileBtn, closeProfileModal;
  let btnLogout;

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
    deleteProjectBtn = document.getElementById("deleteProjectBtn");
    openProfileBtn = document.getElementById("openProfileBtn");
    closeProfileModal = document.getElementById("closeProfileModal");

    btnLogout = document.getElementById("btnLogout");
  }

  // ---------- Utilitaires ----------
  function escapeHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function countWords(s) {
    if (!s) return 0;
    return s.trim().split(/\s+/).filter(Boolean).length;
  }

  // ---------- Stats ----------
  function recomputeStats() {
    const projects = getProjects();
    const statProjects = document.getElementById("statProjects");
    const statWords = document.getElementById("statWords");
    const statSuccess = document.getElementById("statSuccess");

    statProjects && (statProjects.innerText = projects.length);
    const totalWords = projects.reduce((acc, p) => acc + (p.words || 0), 0);
    statWords && (statWords.innerText = totalWords);
    const successCount = projects.filter((p) => p.status === "termine").length;
    statSuccess && (statSuccess.innerText = successCount);
  }

  // ---------- Render projects ----------
  function renderProjects() {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = "";

    const projects = getProjects().sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    projects.forEach((p) => {
      const card = document.createElement("div");
      card.className = "project-card";
      card.dataset.id = p.id;

      const dateStr = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : "--/--/----";
      const words = p.words || 0;
      const status = p.status || "brouillon";

      card.innerHTML = `
        <div>
          <h3 style="font-weight:700;">${escapeHtml(
            p.title || "Sans titre"
          )}</h3>
          <span class="project-badge ${
            status === "termine" ? "termine" : "brouillon"
          }">
            ${status === "termine" ? "Terminé" : "Brouillon"}
          </span>
          <p>${escapeHtml(p.description || "")}</p>
        </div>
        <div>
          <div class="project-indicators">
            <span>📝 ${words} mots</span>
            <span>📅 ${dateStr}</span>
          </div>
          <div class="project-actions">
            <button class="open-project" data-id="${p.id}">Ouvrir</button>
            <button class="delete-project" data-id="${p.id}">Supprimer</button>
          </div>
        </div>
      `;
      projectsGrid.appendChild(card);
    });

    attachProjectEvents();
    recomputeStats();
  }

  // ---------- Events on project cards ----------
  function attachProjectEvents() {
    projectsGrid.querySelectorAll(".open-project").forEach((btn) => {
      btn.removeEventListener("click", openProjectHandler);
      btn.addEventListener("click", openProjectHandler);
    });
    projectsGrid.querySelectorAll(".delete-project").forEach((btn) => {
      btn.removeEventListener("click", deleteProjectHandler);
      btn.addEventListener("click", deleteProjectHandler);
    });
  }
  function openProjectHandler(e) {
    const id = e.currentTarget.dataset.id;
    openProject(id);
  }
  function deleteProjectHandler(e) {
    const id = e.currentTarget.dataset.id;
    if (!confirm("Confirmer la suppression de ce projet ?")) return;
    const projects = getProjects().filter((p) => p.id !== id);
    saveProjects(projects);
    renderProjects();
    showToast("Projet supprimé");
  }

  // ---------- Open project ----------
  function openProject(id) {
    const projects = getProjects();
    const p = projects.find((x) => x.id === id);
    if (!p) return showToast("Projet introuvable");

    const modal = document.getElementById("activeProjectModal");
    modal.dataset.id = id;
    modal.style.display = "flex";

    const titleEl = document.getElementById("activeProjectTitle");
    const originalEl = document.getElementById("originalText");
    const reformulatedEl = document.getElementById("reformulatedText");
    const enhancedEl = document.getElementById("enhancedText");
    const planEl = document.getElementById("planText");
    const ideaEl = document.getElementById("ideaOutput");
    const writingEl = document.getElementById("writingAssistantOutput");

    if (titleEl) titleEl.value = p.title || "";
    if (originalEl) originalEl.value = p.content || p.description || "";
    if (reformulatedEl) reformulatedEl.value = p.reformulated || "";
    if (enhancedEl) enhancedEl.value = p.enhanced || "";
    if (planEl) planEl.value = p.plan || "";
    if (ideaEl) ideaEl.value = p.idea || "";
    if (writingEl) writingEl.value = p.assistant || "";

    originalEl && originalEl.focus();
  }

  // ---------- Save project from modal ----------
  function saveProjectFromModal() {
    const modal = document.getElementById("activeProjectModal");
    if (!modal || !modal.dataset.id) return showToast("Aucun projet ouvert");
    const id = modal.dataset.id;
    const projects = getProjects();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) return showToast("Projet introuvable");

    const title = document.getElementById("activeProjectTitle")?.value || "";
    const original = document.getElementById("originalText")?.value || "";
    const reformulated =
      document.getElementById("reformulatedText")?.value || "";
    const enhanced = document.getElementById("enhancedText")?.value || "";
    const plan = document.getElementById("planText")?.value || "";
    const idea = document.getElementById("ideaOutput")?.value || "";
    const assistant =
      document.getElementById("writingAssistantOutput")?.value || "";

    projects[idx].title = title;
    projects[idx].content = original;
    projects[idx].reformulated = reformulated;
    projects[idx].enhanced = enhanced;
    projects[idx].plan = plan;
    projects[idx].idea = idea;
    projects[idx].assistant = assistant;
    projects[idx].words = countWords(original);

    saveProjects(projects);
    renderProjects();
    showToast("Projet enregistré");
  }

  // ---------- Delete current project ----------
  function deleteCurrentProjectFromModal() {
    const modal = document.getElementById("activeProjectModal");
    if (!modal || !modal.dataset.id) return;
    const id = modal.dataset.id;
    if (!confirm("Supprimer ce projet ?")) return;
    const projects = getProjects().filter((p) => p.id !== id);
    saveProjects(projects);
    modal.style.display = "none";
    renderProjects();
    showToast("Projet supprimé");
  }

  // ---------- New project ----------
  function openNewProjectModal() {
    if (!newProjectModal) return;
    newProjectModal.style.display = "flex";
    newProjectModal.setAttribute("aria-hidden", "false");
    const first = newProjectModal.querySelector("input, textarea, select");
    first && first.focus();
  }
  function closeNewProjectModal() {
    if (!newProjectModal) return;
    newProjectModal.style.display = "none";
    newProjectModal.setAttribute("aria-hidden", "true");
  }
  function submitNewProject(e) {
    e.preventDefault();
    const title = (e.target.title?.value || "").trim();
    const description = (e.target.description?.value || "").trim();
    if (!title) return showToast("Titre requis");

    const projects = getProjects();
    const newP = {
      id: generateId(),
      title,
      description,
      content: "",
      reformulated: "",
      enhanced: "",
      plan: "",
      idea: "",
      assistant: "",
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

  // ---------- Secure fetch AI ----------
  async function callAI(endpoint, payload) {
    try {
      const response = await fetch(
        endpoint.startsWith("/") ? endpoint : `/api/ai/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      // Read text then try parse (garde ton diagnostic d'origine)
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("❌ Réponse invalide de l'API :", text);
        showToast("Erreur serveur : réponse invalide");
        return null;
      }

      if (!response.ok) {
        console.error("❌ Erreur API :", data);
        showToast(`Erreur API : ${data.error || response.statusText}`);
        return null;
      }

      return data;
    } catch (err) {
      console.error("❌ Erreur réseau ou Fetch :", err);
      showToast("Erreur réseau : impossible de contacter le serveur");
      return null;
    }
  }

  // ---------- Handlers AI ----------
  async function handleReformulate() {
    const original = document.getElementById("originalText")?.value || "";
    if (!original) return showToast("Écrivez un texte d'abord");
    showToast("Reformulation en cours...");
    const res = await callAI("reformulate", { text: original });
    if (!res) return;
    const out = document.getElementById("reformulatedText");
    out.value =
      res.reformulated ||
      res.improved ||
      res.enhanced ||
      res.text ||
      res.improved ||
      "";
    showToast("Texte reformulé");
  }

  async function handleEnhance() {
    const original = document.getElementById("originalText")?.value || "";
    if (!original) return showToast("Écrivez un texte d'abord");
    showToast("Enrichissement en cours...");
    const res = await callAI("enhance", { text: original });
    if (!res) return;
    const out = document.getElementById("enhancedText");
    out.value = res.enhanced || res.improved || res.text || "";
    showToast("Texte enrichi");
  }

  async function handlePlan() {
    const original = document.getElementById("originalText")?.value || "";
    if (!original) return showToast("Écrivez un texte d'abord");
    showToast("Génération de plan...");
    const res = await callAI("plan", { text: original });
    if (!res) return;
    const out = document.getElementById("planText");
    out.value = res.plan || res.text || "";
    showToast("Plan généré");
  }

  async function handleIdea() {
    const genre = document.getElementById("genreInput")?.value || "Roman";
    const summary = document.getElementById("originalText")?.value || "";
    if (!summary) return showToast("Résumé requis pour générer des idées");
    showToast("Génération d'idées...");
    const res = await callAI("idea", { genre, summary });
    if (!res) return;
    const out = document.getElementById("ideaOutput");
    out.value = res.ideas || res.text || "";
    showToast("Idées générées");
  }

  async function handleWritingAssistant() {
    const original = document.getElementById("originalText")?.value || "";
    if (!original) return showToast("Écrivez un texte d'abord");
    showToast("Assistant d'écriture en cours...");
    const res = await callAI("writing-assistant", { text: original });
    if (!res) return;
    const out = document.getElementById("writingAssistantOutput");
    out.value = res.suggestions || res.text || "";
    showToast("Suggestions générées");
  }

  // ---------- Overlay & Escape ----------
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
          if (o.style.display && o.style.display !== "none") {
            o.style.display = "none";
            o.setAttribute("aria-hidden", "true");
          }
        });
        const ap = document.getElementById("activeProjectModal");
        if (ap && ap.style.display && ap.style.display !== "none") {
          ap.style.display = "none";
        }
      }
    });
  }

  // ---------- Logout ----------
  function attachLogout() {
    if (!btnLogout) return;
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("token");
      showToast("Déconnecté");
      setTimeout(() => (window.location.href = "login.html"), 600);
    });
  }

  // ---------- Seed sample projects ----------
  function seedIfEmpty() {
    const projects = getProjects();
    if (projects.length === 0) {
      const demo = [
        {
          id: generateId(),
          title: "Les Chroniques de Jupiter",
          description: "Un récit épique entre étoiles et révolutions.",
          content: "",
          reformulated: "",
          enhanced: "",
          plan: "",
          idea: "",
          assistant: "",
          status: "brouillon",
          words: 320,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
        },
        {
          id: generateId(),
          title: "Recueil de contes",
          description: "Courtes histoires pour longues nuits.",
          content: "",
          reformulated: "",
          enhanced: "",
          plan: "",
          idea: "",
          assistant: "",
          status: "termine",
          words: 12000,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
        },
      ];
      saveProjects(demo);
    }
  }

  // ---------- Init ----------
  function init() {
    initToast();
    cacheElements();
    attachLogout();
    attachOverlayClose();

    // UI buttons/forms
    newProjectBtn?.addEventListener("click", openNewProjectModal);
    openNewProjectBtn?.addEventListener("click", openNewProjectModal);
    cancelNewProjectBtn?.addEventListener("click", closeNewProjectModal);
    projectForm?.addEventListener("submit", submitNewProject);

    saveProjectBtn?.addEventListener("click", saveProjectFromModal);
    deleteProjectBtn?.addEventListener("click", deleteCurrentProjectFromModal);

    // AI buttons
    document
      .getElementById("btnReformulate")
      ?.addEventListener("click", handleReformulate);
    document
      .getElementById("btnEnhance")
      ?.addEventListener("click", handleEnhance);
    document
      .getElementById("btnGeneratePlan")
      ?.addEventListener("click", handlePlan);
    document
      .getElementById("btnRefineIdea")
      ?.addEventListener("click", handleIdea);
    document
      .getElementById("btnWritingAssistant")
      ?.addEventListener("click", handleWritingAssistant);

    // profile modal open/close
    openProfileBtn?.addEventListener("click", () => {
      profileModal && (profileModal.style.display = "flex");
    });
    closeProfileModal?.addEventListener("click", () => {
      profileModal && (profileModal.style.display = "none");
    });

    // close button inside active project modal
    document.querySelectorAll(".close-project").forEach((btn) =>
      btn.addEventListener("click", () => {
        const ap = document.getElementById("activeProjectModal");
        ap && (ap.style.display = "none");
      })
    );

    seedIfEmpty();
    renderProjects();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.openProject = openProject;
})();
