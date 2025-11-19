document.addEventListener("DOMContentLoaded", () => {
  const inscriptionForm = document.getElementById("inscription-form");
  const connexionForm = document.getElementById("connexion-form");

  const BASE_URL = "http://127.0.0.1:3000"; // port correct

  // Gestion de l'inscription
  inscriptionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = {
      nom: document.getElementById("nom").value,
      prenom: document.getElementById("prenom").value,
      email: document.getElementById("email").value,
      mot_de_passe: document.getElementById("mot_de_passe").value,
    };

    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'inscription");
      }

      const data = await response.json();
      alert("Inscription réussie !");
      document.getElementById("inscription-section").style.display = "none";
      document.getElementById("connexion-section").style.display = "block";
    } catch (error) {
      console.error("Erreur:", error);
      alert(`Erreur lors de l'inscription: ${error.message}`);
    }
  });

  // Gestion de la connexion
  connexionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = {
      email: document.getElementById("connexion-email").value,
      mot_de_passe: document.getElementById("connexion-mot_de_passe").value,
    };

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la connexion");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("utilisateur", JSON.stringify(data.utilisateur));
      alert("Connexion réussie !");
      document.getElementById("connexion-section").style.display = "none";
      document.getElementById("projets-section").style.display = "block";
      loadProjets(data.utilisateur.id_utilisateur);
    } catch (error) {
      console.error("Erreur:", error);
      alert(`Erreur lors de la connexion: ${error.message}`);
    }
  });

  // Charger les projets (à adapter selon vos routes projets)
  async function loadProjets(userId) {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token non trouvé");

      // Exemple : ajuster l'URL selon votre API projets
      const response = await fetch(
        `${BASE_URL}/api/projets/utilisateur/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors du chargement des projets"
        );
      }

      const projets = await response.json();
      const projetsList = document.getElementById("projets-list");
      projetsList.innerHTML = "";

      if (projets.length === 0) {
        projetsList.innerHTML = "<p>Aucun projet trouvé.</p>";
      } else {
        projets.forEach((projet) => {
          const projetElement = document.createElement("div");
          projetElement.innerHTML = `
            <h3>${projet.titre}</h3>
            <p>${projet.description || "Aucune description"}</p>
            <p>Statut: ${projet.statut}</p>
          `;
          projetsList.appendChild(projetElement);
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert(`Erreur lors du chargement des projets: ${error.message}`);
    }
  }

  // Vérifier si l'utilisateur est déjà connecté
  const utilisateur = localStorage.getItem("utilisateur");
  if (utilisateur) {
    document.getElementById("inscription-section").style.display = "none";
    document.getElementById("connexion-section").style.display = "none";
    document.getElementById("projets-section").style.display = "block";
    const user = JSON.parse(utilisateur);
    loadProjets(user.id_utilisateur);
  }
});
