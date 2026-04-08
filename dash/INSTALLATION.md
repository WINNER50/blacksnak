# 🚀 BLACKSNACK - Guide d'Installation

## 📋 Prérequis

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0
- **npm** >= 9.0.0

---

## 🗄️ Configuration de la Base de Données

### 1. Créer la base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE blacksnack;

# Se connecter à la base
\c blacksnack

# Quitter
\q
```

### 2. Initialiser le schéma

```bash
# Exécuter le script SQL
psql -U postgres -d blacksnack -f database.sql
```

---

## 🔧 Installation du Backend

### 1. Aller dans le dossier backend

```bash
cd backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer le fichier .env

Créez un fichier `.env` à la racine du dossier backend :

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blacksnack
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_cle_secrete_super_complexe_changez_moi
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Démarrer le serveur

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le backend sera accessible sur : **http://localhost:5000**

---

## 🎨 Installation du Frontend

### 1. Aller dans le dossier frontend

```bash
cd frontend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer le fichier .env

Créez un fichier `.env` à la racine du dossier frontend :

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Démarrer l'application

```bash
npm run dev
```

Le frontend sera accessible sur : **http://localhost:5173**

---

## 🧪 Tester l'API

### 1. Health Check

```bash
curl http://localhost:5000/health
```

### 2. Login Admin (exemple)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blacksnack.com",
    "password": "admin123"
  }'
```

### 3. Récupérer la liste des utilisateurs

```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## 📁 Structure Finale du Projet

```
blacksnack/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── config.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── rechargeController.js
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── rechargeRoutes.js
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandler.js
│   │   └── server.js
│   ├── database.sql
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   └── App.tsx
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── userService.js
    │   │   ├── rechargeService.js
    │   │   └── ...
    │   └── config.js
    ├── package.json
    └── .env
```

---

## 🔐 Compte Admin par Défaut

Après l'initialisation de la base de données, utilisez ces identifiants :

- **Email** : `admin@blacksnack.com`
- **Mot de passe** : `admin123`

⚠️ **IMPORTANT** : Changez ces identifiants en production !

---

## 🛠️ Scripts Utiles

### Backend

```bash
npm start          # Démarrer en production
npm run dev        # Démarrer en développement
npm run db:init    # Initialiser la base de données
npm test           # Lancer les tests
```

### Frontend

```bash
npm run dev        # Démarrer en développement
npm run build      # Build pour production
npm run preview    # Prévisualiser le build
```

---

## 🔍 Vérification de l'Installation

### 1. Backend

✅ Le serveur démarre sans erreur  
✅ La connexion à la base de données fonctionne  
✅ Le endpoint `/health` répond  
✅ Le login admin fonctionne  

### 2. Frontend

✅ L'application démarre sans erreur  
✅ La page de login s'affiche  
✅ La connexion à l'API fonctionne  

---

## 📚 Endpoints API Disponibles

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil actuel

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Détails d'un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Recharges
- `POST /api/recharges` - Recharger un compte
- `GET /api/recharges` - Historique des recharges
- `POST /api/recharges/system` - Opération système
- `GET /api/recharges/system/balance` - Solde système

### Transactions
- `GET /api/transactions` - Liste des transactions
- `GET /api/payment-methods` - Méthodes de paiement

Et bien d'autres... (voir ARCHITECTURE.md)

---

## 🆘 Support

Pour toute question ou problème :

1. Vérifiez que PostgreSQL est bien démarré
2. Vérifiez les logs du backend pour les erreurs
3. Vérifiez que les variables d'environnement sont correctes
4. Vérifiez que les ports 5000 et 5173 sont disponibles

---

## 📝 Licence

MIT License - Blacksnack Team © 2026
