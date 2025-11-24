// backend/routes/api/profile.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- multer storage vers /public/uploads
const uploadDir = path.join(__dirname, "../../../public/uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    cb(null, `${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.test(ext));
  },
});

// Helper to get current user id (from session or fallback)
async function getCurrentUserId(req) {
  if (req.session && req.session.userId) return req.session.userId;
  // fallback: return first user id if exists (for testing)
  const user = await prisma.user.findFirst();
  return user ? user.id : null;
}

// GET profile
router.get("/", async (req, res) => {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        // champs additionnels si tu veux en ajouter (age, gender, theme) :
        // supposons tu as des colonnes 'age','gender','theme' dans User sinon on stocke ailleurs
        age: true,
        gender: true,
        theme: true,
        photo: true,
      },
    });

    if (!user)
      return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ success: true, user });
  } catch (err) {
    console.error("GET /api/profile error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT update profile (email non modifiable)
router.put("/", async (req, res) => {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { name, username, age, gender, theme } = req.body;

    // Ne pas autoriser la modification de l'email ici (côté front il est readonly).
    const data = {
      name: name ?? undefined,
      username: username ?? undefined,
      age: age ?? undefined,
      gender: gender ?? undefined,
      theme: theme ?? undefined,
    };

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    res.status(500).json({ error: "Impossible de mettre à jour le profil." });
  }
});

// POST upload photo
router.post("/photo", upload.single("photo"), async (req, res) => {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    if (!req.file) return res.status(400).json({ error: "Fichier absent" });

    // chemin relatif public (ex: /uploads/12345.png)
    const publicPath = `/uploads/${req.file.filename}`;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { photo: publicPath },
    });

    res.json({ success: true, photo: publicPath, user: updated });
  } catch (err) {
    console.error("POST /api/profile/photo error:", err);
    res.status(500).json({ error: "Impossible d'uploader la photo." });
  }
});

export default router;
