# Blacksnack Backend API

API REST pour la plateforme Blacksnack - Jeu Snake avec paris en argent réel.

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configuration

Copiez `.env.example` vers `.env` et configurez les variables :

```bash
cp .env.example .env
```

Modifiez les valeurs dans `.env` :

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=blacksnack
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=votre_cle_secrete_complexe
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### 3. Initialiser la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base
CREATE DATABASE blacksnack;

# Quitter
\q

# Exécuter le script SQL
npm run db:init
```

### 4. Démarrer le serveur

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur sera accessible sur : **http://localhost:5000**

## 📁 Structure

```
backend/
├── src/
│   ├── config/          # Configuration (DB, JWT, etc.)
│   ├── controllers/     # Logique métier
│   ├── routes/          # Routes API
│   ├── middleware/      # Middlewares (auth, errors)
│   └── server.js        # Point d'entrée
├── database.sql         # Script DDL
├── package.json
├── .env.example
└── README.md
```

## 🔌 Endpoints API

### Authentification
- `POST /api/auth/login` - Connexion admin
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil actuel
- `POST /api/auth/refresh` - Rafraîchir token

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Détails utilisateur
- `PUT /api/users/:id` - Modifier utilisateur
- `DELETE /api/users/:id` - Supprimer utilisateur
- `PUT /api/users/:id/status` - Changer statut
- `GET /api/users/:id/stats` - Statistiques utilisateur

### Recharges
- `POST /api/recharges` - Recharger compte joueur
- `GET /api/recharges` - Historique recharges
- `POST /api/recharges/system` - Opération système
- `GET /api/recharges/system` - Historique système
- `GET /api/recharges/system/balance` - Solde système

## 🔐 Authentification

Toutes les routes (sauf `/api/auth/login`) nécessitent un token JWT dans le header :

```
Authorization: Bearer VOTRE_TOKEN_JWT
```

## 👤 Compte Admin par Défaut

Après initialisation de la DB :

- **Email** : `admin@blacksnack.com`
- **Mot de passe** : `admin123`

⚠️ Changez ces identifiants en production !

## 📝 Licence

MIT © Blacksnack Team
