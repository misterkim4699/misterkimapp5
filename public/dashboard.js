/* Dashboard.js - corrigé & cohérent avec ton HTML
   - Un seul module IIFE
   - Pas de duplications
   - Références aux bons IDs
   - Sauvegarde complète dans localStorage
*/

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
    // open
    projectsGrid.querySelectorAll(".open-project").forEach((btn) => {
      btn.removeEventListener("click", openProjectHandler);
      btn.addEventListener("click", openProjectHandler);
    });
    // delete
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

  // ---------- Open project (fill editor fields) ----------
  function openProject(id) {
    const projects = getProjects();
    const p = projects.find((x) => x.id === id);
    if (!p) return showToast("Projet introuvable");

    // set dataset on modal
    const modal = document.getElementById("activeProjectModal");
    modal.dataset.id = id;
    modal.style.display = "flex";

    // fill fields (ids must exist in HTML)
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

    // focus original
    originalEl && originalEl.focus();
  }

  // ---------- Save from active modal (all fields) ----------
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

  // ---------- Delete current project (button in modal) ----------
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

  // ---------- New project flow ----------
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

  // ---------- AI placeholders ----------
  function applyAIReformulate() {
    const original = document.getElementById("originalText")?.value || "";
    if (!original) return showToast("Écrivez un texte d'abord");
    // placeholder naive
    document.getElementById("reformulatedText").value = original
      .split(".")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(". ");
    showToast("Reformulation simulée");
  }
  function applyAIEnhance() {
    const original = document.getElementById("originalText")?.value || "";
    if (!original) return showToast("Écrivez un texte d'abord");
    document.getElementById("enhancedText").value =
      original +
      "\n\n[Ajouté : développement, descriptions et dialogues — simulation]";
    showToast("Enrichissement simulé");
  }
  function generatePlan() {
    document.getElementById("planText").value =
      "1. Accroche\n2. Conflit\n3. Montée de tension\n4. Résolution";
    showToast("Plan généré (simulation)");
  }
  function refineIdea() {
    document.getElementById("ideaOutput").value =
      "Genre : Thriller\nPoints d'intrigue : ...\nPersonnages : ...";
    showToast("Idées générées (simulation)");
  }
  function writingAssistant() {
    document.getElementById("writingAssistantOutput").value =
      "- Suggestion 1\n- Suggestion 2\n- Prompt pour continuer...";
    showToast("Suggestions générées (simulation)");
  }

  // ---------- Overlay click & Escape ----------
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
        // close any visible overlay
        document.querySelectorAll(".modal-overlay").forEach((o) => {
          if (o.style.display && o.style.display !== "none") {
            o.style.display = "none";
            o.setAttribute("aria-hidden", "true");
          }
        });
        // close activeProjectModal if open (it's not a modal-overlay)
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

  // ---------- Seed sample projects if empty ----------
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

    // wire UI buttons/forms (guard with optional chaining)
    newProjectBtn?.addEventListener("click", openNewProjectModal);
    openNewProjectBtn?.addEventListener("click", openNewProjectModal);
    cancelNewProjectBtn?.addEventListener("click", closeNewProjectModal);
    projectForm?.addEventListener("submit", submitNewProject);

    // modal save / delete
    saveProjectBtn?.addEventListener("click", saveProjectFromModal);
    deleteProjectBtn?.addEventListener("click", deleteCurrentProjectFromModal);

    // AI buttons (ids must exist in HTML if used)
    document
      .getElementById("btnReformulate")
      ?.addEventListener("click", applyAIReformulate);
    document
      .getElementById("btnEnhance")
      ?.addEventListener("click", applyAIEnhance);
    document
      .getElementById("btnGeneratePlan")
      ?.addEventListener("click", generatePlan);
    document
      .getElementById("btnRefineIdea")
      ?.addEventListener("click", refineIdea);
    document
      .getElementById("btnWritingAssistant")
      ?.addEventListener("click", writingAssistant);

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

    // seed and render
    seedIfEmpty();
    renderProjects();
  }

  // Start when DOM loaded
  document.addEventListener("DOMContentLoaded", init);

  // expose openProject to global if needed by external code (optional)
  window.openProject = openProject;
})();
