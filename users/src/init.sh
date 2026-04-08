#!/bin/bash

# Script d'initialisation du projet Blacksnack
# Usage: bash init.sh

echo "🐍 =============================================="
echo "   Initialisation du projet Blacksnack"
echo "============================================== 🐍"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Vérifier Node.js
echo "📦 Vérification de Node.js..."
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js est installé (${NODE_VERSION})${NC}"
else
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo "   Téléchargez Node.js sur https://nodejs.org/"
    exit 1
fi
echo ""

# 2. Vérifier npm
echo "📦 Vérification de npm..."
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm est installé (v${NPM_VERSION})${NC}"
else
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi
echo ""

# 3. Vérifier PostgreSQL ou MySQL
echo "🗄️  Vérification de la base de données..."
if command_exists psql; then
    echo -e "${GREEN}✅ PostgreSQL est installé${NC}"
    DB_TYPE="postgresql"
elif command_exists mysql; then
    echo -e "${GREEN}✅ MySQL est installé${NC}"
    DB_TYPE="mysql"
else
    echo -e "${YELLOW}⚠️  Ni PostgreSQL ni MySQL n'est détecté${NC}"
    echo "   Veuillez installer l'un des deux avant de continuer"
    echo "   PostgreSQL: https://www.postgresql.org/download/"
    echo "   MySQL: https://dev.mysql.com/downloads/"
    exit 1
fi
echo ""

# 4. Installation des dépendances backend
echo "📦 Installation des dépendances backend..."
cd backend
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json non trouvé dans /backend${NC}"
    exit 1
fi

npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dépendances backend installées${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'installation des dépendances backend${NC}"
    exit 1
fi
cd ..
echo ""

# 5. Configuration du fichier .env
echo "⚙️  Configuration du fichier .env..."
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${YELLOW}⚠️  Fichier .env créé depuis .env.example${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANT: Éditez backend/.env avec vos paramètres${NC}"
        echo ""
        echo "   Paramètres à configurer:"
        echo "   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
        echo "   - JWT_SECRET (générez une clé sécurisée)"
        echo ""
    else
        echo -e "${RED}❌ Fichier .env.example non trouvé${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Fichier .env existe déjà${NC}"
fi
echo ""

# 6. Initialisation de la base de données
echo "🗄️  Initialisation de la base de données..."
echo -e "${YELLOW}⚠️  Étapes manuelles requises:${NC}"
echo ""
if [ "$DB_TYPE" = "postgresql" ]; then
    echo "   1. Connectez-vous à PostgreSQL:"
    echo "      psql -U postgres"
    echo ""
    echo "   2. Créez la base de données:"
    echo "      CREATE DATABASE blacksnack;"
    echo ""
    echo "   3. Connectez-vous à la base:"
    echo "      \\c blacksnack"
    echo ""
    echo "   4. Exécutez le script SQL:"
    echo "      \\i $(pwd)/backend/database.sql"
else
    echo "   1. Connectez-vous à MySQL:"
    echo "      mysql -u root -p"
    echo ""
    echo "   2. Créez la base de données:"
    echo "      CREATE DATABASE blacksnack;"
    echo "      USE blacksnack;"
    echo ""
    echo "   3. Exécutez le script SQL:"
    echo "      source $(pwd)/backend/database.sql;"
fi
echo ""

# 7. Résumé
echo "✅ =============================================="
echo "   Installation terminée !"
echo "============================================== ✅"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Configurez votre base de données (voir instructions ci-dessus)"
echo ""
echo "2. Éditez backend/.env avec vos paramètres"
echo ""
echo "3. Démarrez le serveur backend:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "4. Dans un autre terminal, configurez le frontend:"
echo "   Éditez frontend/config.js si nécessaire"
echo ""
echo "5. Testez l'API:"
echo "   cd backend"
echo "   node test-api.js"
echo ""
echo "📚 Documentation:"
echo "   - README.md : Documentation principale"
echo "   - ARCHITECTURE.md : Architecture détaillée"
echo "   - MIGRATION.md : Guide de migration"
echo ""
echo "🎮 Bon développement avec Blacksnack !"
echo ""
