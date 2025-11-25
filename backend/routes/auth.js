// backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../db.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/login.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/register.html"));
});

// Limitation des tentatives de connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  },
});

// Regex de validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

/* POST /register — Création de compte (activé directement) */
router.post("/register", async (req, res) => {
  try {
    let { nom, prenom, email, username, password } = req.body;

    nom = nom?.trim();
    prenom = prenom?.trim();
    email = email?.trim().toLowerCase();
    username = username?.trim();
    password = password?.trim();

    if (!nom || !prenom || !email || !password) {
      return res
        .status(400)
        .json({ error: "Tous les champs obligatoires doivent être remplis." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email invalide." });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Mot de passe trop faible. Il doit contenir 8 caractères minimum, une majuscule, une minuscule, un chiffre et un symbole.",
      });
    }

    // Génération automatique du username si non fourni
    if (!username) {
      let baseUsername = email.split("@")[0];
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (
        await prisma.user.findUnique({ where: { username: uniqueUsername } })
      ) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }
      username = uniqueUsername;
    }

    // Vérification de l'existence
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Cet email ou nom d'utilisateur est déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Création utilisateur ACTIVÉ directement
    const newUser = await prisma.user.create({
      data: {
        name: `${prenom} ${nom}`,
        email,
        username,
        password: hashedPassword,
        isActive: true, // <-- ACTIVÉ AUTOMATIQUEMENT
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        isActive: true,
      },
    });

    return res.status(201).json({
      message: "Inscription réussie. Vous pouvez maintenant vous connecter.",
      user: newUser,
    });
  } catch (err) {
    console.error("❌ Erreur inscription:", err);
    if (err?.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Email ou nom d'utilisateur déjà utilisé." });
    }
    return res
      .status(500)
      .json({ error: "Erreur interne lors de la création du compte." });
  }
});

/* POST /login — Connexion (plus de vérification d'activation) */
router.post("/login", loginLimiter, async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!email || !password)
      return res.status(400).json({ error: "Email et mot de passe requis." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(401).json({ error: "Identifiants incorrects." });

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid)
      return res.status(401).json({ error: "Identifiants incorrects." });

    // Création de la session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
    };

    return res.json({ message: "Connexion réussie.", user: req.session.user });
  } catch (err) {
    console.error("❌ Erreur connexion:", err);
    return res
      .status(500)
      .json({ error: "Erreur interne lors de la connexion." });
  }
});

/* GET /logout — Déconnexion */
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err)
      return res.status(500).json({ error: "Erreur lors de la déconnexion." });
    res.clearCookie("connect.sid", { path: "/" });
    return res.json({ message: "Déconnexion réussie." });
  });
});

export default router;
