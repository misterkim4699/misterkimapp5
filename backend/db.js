// backend/db.js
import { PrismaClient } from "@prisma/client";

let prisma;

// ✅ Evite de créer plusieurs instances de Prisma lors du hot-reload (dev)
if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"], // Affiche toutes les requêtes et erreurs
  });
}

prisma = global.prisma;

// 🔌 Connexion à la base MySQL
prisma
  .$connect()
  .then(() => console.log("✅ Connexion MySQL réussie avec Prisma"))
  .catch((err) => console.error("❌ Erreur de connexion MySQL :", err));

// 🔄 Middleware optionnel pour vérifier la connexion
export const checkDbConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Base de données OK");
  } catch (err) {
    console.error("❌ La base de données ne répond pas :", err);
  }
};

export default prisma;
