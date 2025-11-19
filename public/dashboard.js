const apiBase = "http://localhost:5000/api";
const DAILY_WORD_GOAL = 500;

let projets = [];
let projetActif = null;

const projectsGrid = document.getElementById("projectsGrid");
const activeProjectContainer = document.getElementById(
  "activeProjectContainer"
);
const activeTitle = document.getElementById("activeTitle");
const activeDescription = document.getElementById("activeDescription");

// ----------------- Load Projects -----------------
async function loadProjects() {
  const res = await fetch(`${apiBase}/project`, { credentials: "include" });
  projets = res.ok ? await res.json() : [];

  projectsGrid.innerHTML = "";
  projets.forEach((p) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.description?.substring(0, 80) || ""}...</p>
      <div class="project-actions">
        <button class="edit-btn" data-id="${p.id}">✏️</button>
        <button class="delete-btn" data-id="${p.id}">🗑️</button>
      </div>
    `;
    projectsGrid.appendChild(card);
  });

  document
    .querySelectorAll(".edit-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () => selectProject(btn.dataset.id))
    );
  document
    .querySelectorAll(".delete-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () => deleteProject(btn.dataset.id))
    );
  updateStats();
}

// ----------------- Select Project -----------------
function selectProject(id) {
  projetActif = projets.find((p) => p.id == id);
  if (!projetActif) return;
  activeProjectContainer.style.display = "block";
  activeTitle.textContent = projetActif.title;
  activeDescription.value = projetActif.description || "";
}

// ----------------- Save Project -----------------
document.getElementById("saveProject").addEventListener("click", async () => {
  if (!projetActif) return;
  const desc = activeDescription.value;
  await fetch(`${apiBase}/project/${projetActif.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ description: desc }),
  });
  loadProjects();
});

// ----------------- Delete Project -----------------
async function deleteProject(id) {
  if (!confirm("Voulez-vous vraiment supprimer ce projet ?")) return;
  await fetch(`${apiBase}/project/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  loadProjects();
}

// ----------------- New Project -----------------
const newProjectBtn = document.getElementById("newProjectBtn");
const newProjectForm = document.getElementById("newProjectForm");
const cancelNewProject = document.getElementById("cancelNewProject");

newProjectBtn.addEventListener(
  "click",
  () => (newProjectForm.style.display = "block")
);
cancelNewProject.addEventListener(
  "click",
  () => (newProjectForm.style.display = "none")
);

document.getElementById("projectForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const style = document.getElementById("style").value;
  await fetch(`${apiBase}/project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, description, style }),
  });
  document.getElementById("projectForm").reset();
  newProjectForm.style.display = "none";
  loadProjects();
});

// ----------------- Stats -----------------
function updateStats() {
  document.getElementById("statProjects").textContent = projets.length;
  const totalWords = projets.reduce((sum, p) => sum + (p.wordCount || 0), 0);
  document.getElementById("statWords").textContent = totalWords;
  const wordsToday = projets.reduce(
    (sum, p) => sum + (p.wordCountToday || 0),
    0
  );
  document.getElementById("dailyGoalMessage").textContent =
    wordsToday >= DAILY_WORD_GOAL
      ? `🎉 Objectif atteint ! (${wordsToday}/${DAILY_WORD_GOAL})`
      : `✏️ Objectif : ${
          DAILY_WORD_GOAL - wordsToday
        } mots restants (${wordsToday}/${DAILY_WORD_GOAL})`;
}

loadProjects();

