// LocalStorage Projects
function getProjects(){return JSON.parse(localStorage.getItem('projects')||'[]');}
function saveProjects(p){localStorage.setItem('projects',JSON.stringify(p));}
function generateId(){return '_' + Math.random().toString(36).substr(2,9);}

// Render projects
function renderProjects(){
    const grid=document.querySelector('.projects-grid');
    grid.innerHTML='';
    const projects=getProjects();
    document.getElementById('statProjects').innerText=projects.length;
    projects.forEach(p=>{
        const card=document.createElement('div');
        card.className='project-card';
        card.innerHTML=`<h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="project-actions">
        <button class="open-project" data-id="${p.id}">Ouvrir</button>
        <button class="delete-project" data-id="${p.id}">Supprimer</button>
        </div>`;
        grid.appendChild(card);
    });
    attachProjectEvents();
}

function attachProjectEvents(){
    document.querySelectorAll('.open-project').forEach(btn=>btn.addEventListener('click',e=>openProject(e.target.dataset.id)));
    document.querySelectorAll('.delete-project').forEach(btn=>btn.addEventListener('click',e=>deleteProject(e.target.dataset.id)));
}

function openProject(id){
    const projects=getProjects();
    const p=projects.find(x=>x.id===id);
    if(!p) return;
    const modal=document.querySelector('.active-project');
    modal.querySelector('textarea').value=p.content||p.description;
    modal.dataset.id=id;
    modal.style.display='flex';
}

// Save project content
document.getElementById('saveProject').addEventListener('click',()=>{
    const modal=document.querySelector('.active-project');
    const id=modal.dataset.id;
    const content=modal.querySelector('textarea').value;
    const projects=getProjects();
    const idx=projects.findIndex(p=>p.id===id);
    if(idx>=0){projects[idx].content=content;saveProjects(projects);renderProjects();}
    alert('Projet enregistré !');
});

// Delete project
function deleteProject(id){
    let projects=getProjects();
    projects=projects.filter(p=>p.id!==id);
    saveProjects(projects);
    renderProjects();
}

// Nouveau projet
const newProjectModal=document.querySelector('.new-project-form');
document.getElementById('newProjectBtn').addEventListener('click',()=>{newProjectModal.style.display='flex';});
document.getElementById('openNewProjectBtn').addEventListener('click',()=>{newProjectModal.style.display='flex';});
document.getElementById('cancelNewProject').addEventListener('click',()=>{newProjectModal.style.display='none';});
document.getElementById('projectForm').addEventListener('submit',e=>{
    e.preventDefault();
    const title=e.target.title.value.trim();
    const desc=e.target.description.value.trim();
    if(!title) return alert('Titre requis');
    const projects=getProjects();
    projects.push({id:generateId(), title, description:desc, content:'', createdAt:Date.now()});
    saveProjects(projects);
    renderProjects();
    e.target.reset();
    newProjectModal.style.display='none';
});

// IA
document.getElementById('aiProjectBtn').addEventListener('click',()=>{
    const aiSection=document.getElementById('aiSection');
    aiSection.style.display=aiSection.style.display==='none'?'block':'none';
});
document.getElementById('aiEnhance').addEventListener('click',()=>{
    const aiInput=document.getElementById('aiInput');
    const text=aiInput.value.trim();
    if(!text) return alert('Entrez un texte');
    const modal=document.querySelector('.active-project');
    modal.querySelector('textarea').value=text.toUpperCase(); // placeholder IA
    aiInput.value='';
});
document.querySelector('.close-project').addEventListener('click',()=>{document.querySelector('.active-project').style.display='none';});

// PROFIL MODAL
document.getElementById('openProfileBtn').addEventListener('click',()=>{document.getElementById('profileModal').style.display='flex';});
document.getElementById('closeProfileModal').addEventListener('click',()=>{document.getElementById('profileModal').style.display='none';});

// Déconnexion
document.getElementById('btnLogout').addEventListener('click',()=>{
    alert('Vous êtes déconnecté !');
    window.location.href='login.html';
});

// Init
document.addEventListener('DOMContentLoaded',()=>{renderProjects();});