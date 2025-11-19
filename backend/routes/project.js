// backend/routes/project.js
import express from "express";
import prisma from "../db.js";

const router = express.Router();

/* ---------------------------------------------------------
   Middleware : vérifie que l'utilisateur est connecté
--------------------------------------------------------- */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  next();
};

/* ---------------------------------------------------------
   POST /projects — Créer un projet
--------------------------------------------------------- */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Le titre du projet est requis." });
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        userId: req.session.user.id,
      },
    });

    return res.status(201).json({
      message: "Projet créé avec succès.",
      project,
    });
  } catch (err) {
    console.error("❌ Erreur création projet :", err);
    return res
      .status(500)
      .json({ error: "Erreur interne lors de la création du projet." });
  }
});

/* ---------------------------------------------------------
   GET /projects — Obtenir tous les projets de l'utilisateur
--------------------------------------------------------- */
router.get("/", requireAuth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ projects });
  } catch (err) {
    console.error("❌ Erreur récupération projets :", err);
    return res
      .status(500)
      .json({ error: "Erreur interne lors de la récupération des projets." });
  }
});

/* ---------------------------------------------------------
   GET /projects/:id — Obtenir un projet spécifique
--------------------------------------------------------- */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);

    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "ID de projet invalide." });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== req.session.user.id) {
      return res.status(404).json({ error: "Projet introuvable." });
    }

    return res.json({ project });
  } catch (err) {
    console.error("❌ Erreur récupération projet :", err);
    return res
      .status(500)
      .json({ error: "Erreur interne lors de la récupération du projet." });
  }
});

/* ---------------------------------------------------------
   PUT /projects/:id — Modifier un projet
--------------------------------------------------------- */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const { title, description } = req.body;

    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "ID de projet invalide." });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== req.session.user.id) {
      return res
        .status(404)
        .json({ error: "Projet introuvable ou non autorisé." });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: title?.trim() || project.title,
        description:
          description === undefined ? project.description : description?.trim(),
      },
    });

    return res.json({
      message: "Projet mis à jour avec succès.",
      project: updated,
    });
  } catch (err) {
    console.error("❌ Erreur mise à jour projet :", err);
    return res
      .status(500)
      .json({ error: "Erreur interne lors de la mise à jour du projet." });
  }
});

/* ---------------------------------------------------------
   DELETE /projects/:id — Supprimer un projet
--------------------------------------------------------- */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);

    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "ID de projet invalide." });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== req.session.user.id) {
      return res
        .status(404)
        .json({ error: "Projet introuvable ou non autorisé." });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return res.json({ message: "Projet supprimé avec succès." });
  } catch (err) {
    console.error("❌ Erreur suppression projet :", err);
    return res
      .status(500)
      .json({ error: "Erreur interne lors de la suppression du projet." });
  }
});

export default router;

