// backend/server.js
import dotenv from "dotenv";
dotenv.config(); // doit être le premier

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// --- __dirname pour ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Prisma (si tu l'utilises)
import prisma, { checkDbConnection } from "./db.js";

// Import routes
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/project.js";
import aiRoutes from "./routes/api/ai/index.js"; // <-- unique fichier IA

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// CORS (ajuste FRONTEND_URL si besoin)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Sessions
const isProd = process.env.NODE_ENV === "production";
app.use(
  session({
    name: "misterkimapp.sid",
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);

// Static frontend
app.use(express.static(path.join(__dirname, "../public")));

// Health endpoint
app.get("/health", async (req, res) => {
  try {
    await checkDbConnection();
    res.json({ status: "ok" });
  } catch {
    res.status(500).json({ status: "error" });
  }
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Start
app.listen(PORT, async () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
  console.log("🔑 OPENAI_API_KEY chargée :", !!process.env.OPENAI_API_KEY);
  // check db
  if (typeof checkDbConnection === "function") {
    await checkDbConnection();
  }
});