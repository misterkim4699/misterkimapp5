@echo off
echo ============================================
echo   🚀 Lancement du backend MisterKimApp
echo ============================================

cd backend

if not exist package.json (
    echo ❌ ERREUR : Aucun package.json trouvé dans /backend
    echo Assure-toi que tu es bien dans C:\misterkimapp5\backend
    pause
    exit /b
)

echo 📦 Vérification des dépendances...
if not exist node_modules (
    echo 📥 Installation de node_modules...
    npm install
)

echo ▶️ Lancement du serveur avec nodemon...
npm run dev

echo.
echo ============================================
echo   ✔️ Serveur arrêté
echo ============================================
pause