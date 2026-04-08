# 📂 STRUCTURE PROFESSIONNELLE DU PROJET BLACKSNACK

## 🎯 Vue d'Ensemble

```
blacksnack/
│
├── 📁 backend/                      # API Node.js/Express (100% JavaScript)
│   │
│   ├── 📁 src/
│   │   │
│   │   ├── 📁 config/              # ⚙️ Configuration centrale
│   │   │   ├── config.js           # Variables d'environnement
│   │   │   └── database.js         # Pool de connexion PostgreSQL
│   │   │
│   │   ├── 📁 controllers/         # 🎮 Logique métier
│   │   │   ├── authController.js   # Authentification (login, logout, me)
│   │   │   ├── userController.js   # Gestion utilisateurs (CRUD, stats)
│   │   │   └── rechargeController.js # Recharges et opérations système
│   │   │
│   │   ├── 📁 routes/              # 🛣️ Routes API REST
│   │   │   ├── authRoutes.js       # Routes /api/auth/*
│   │   │   ├── userRoutes.js       # Routes /api/users/*
│   │   │   └── rechargeRoutes.js   # Routes /api/recharges/*
│   │   │
│   │   ├── 📁 middleware/          # 🔒 Middlewares
│   │   │   ├── authMiddleware.js   # JWT + Autorisation par rôles
│   │   │   └── errorHandler.js     # Gestion centralisée des erreurs
│   │   │
│   │   └── 📄 server.js            # 🚀 Point d'entrée du serveur
│   │
│   ├── 📄 database.sql              # 🗄️ Script SQL (DDL)
│   ├── 📄 package.json              # 📦 Dépendances Node.js
│   ├── 📄 .env.example              # ⚙️ Template variables d'environnement
│   └── 📄 README.md                 # 📖 Documentation backend
│
└── 📁 frontend/                     # Application React + TypeScript
    │
    ├── 📁 src/
    │   │
    │   ├── 📁 app/
    │   │   ├── 📁 components/      # Composants UI (Layout, Sidebar, etc.)
    │   │   └── 📁 pages/           # Pages du dashboard
    │   │
    │   ├── 📁 services/            # 🔌 Services API
    │   │   ├── api.js              # Client Axios configuré
    │   │   ├── authService.js      # Service authentification
    │   │   ├── userService.js      # Service utilisateurs
    │   │   └── rechargeService.js  # Service recharges
    │   │
    │   └── 📄 config.js            # ⚙️ Configuration (API_URL)
    │
    ├── 📄 package.json              # 📦 Dépendances React
    └── 📄 .env                      # ⚙️ Variables d'environnement
```

---

## 🔧 Backend - Organisation Détaillée

### 📂 `/backend/src/config/` - Configuration

| Fichier | Description |
|---------|-------------|
| `config.js` | Variables d'environnement centralisées (port, DB, JWT, CORS) |
| `database.js` | Pool PostgreSQL + helpers (query, transaction, testConnection) |

### 📂 `/backend/src/controllers/` - Logique Métier

| Fichier | Responsabilité | Fonctions |
|---------|----------------|-----------|
| `authController.js` | Authentification | `login()`, `logout()`, `getMe()`, `refreshToken()` |
| `userController.js` | Gestion utilisateurs | `getAllUsers()`, `getUserById()`, `updateUser()`, `deleteUser()`, `updateUserStatus()`, `getUserStats()` |
| `rechargeController.js` | Recharges & Système | `rechargePlayer()`, `getRechargeHistory()`, `systemOperation()`, `getSystemHistory()`, `getSystemBalance()` |

### 📂 `/backend/src/routes/` - Routes API

| Fichier | Préfixe | Routes principales |
|---------|---------|-------------------|
| `authRoutes.js` | `/api/auth` | `POST /login`, `GET /me`, `POST /logout` |
| `userRoutes.js` | `/api/users` | `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| `rechargeRoutes.js` | `/api/recharges` | `POST /`, `GET /`, `POST /system`, `GET /system/balance` |

### 📂 `/backend/src/middleware/` - Middlewares

| Fichier | Rôle |
|---------|------|
| `authMiddleware.js` | Vérification JWT + Autorisation par rôles (super_admin, admin, moderator) |
| `errorHandler.js` | Gestion centralisée des erreurs + Custom AppError class |

---

## 🎨 Frontend - Organisation Détaillée

### 📂 `/src/services/` - Services API

| Fichier | Description | Fonctions principales |
|---------|-------------|----------------------|
| `api.js` | Client Axios configuré avec intercepteurs | `apiGet()`, `apiPost()`, `apiPut()`, `apiDelete()` |
| `authService.js` | Gestion authentification | `login()`, `logout()`, `getMe()`, `refreshToken()` |
| `userService.js` | Gestion utilisateurs | `getUsers()`, `getUserById()`, `updateUser()`, `deleteUser()`, `updateUserStatus()` |
| `rechargeService.js` | Gestion recharges | `rechargePlayer()`, `getRechargeHistory()`, `systemOperation()`, `getSystemBalance()` |

### 📄 `/src/config.js` - Configuration Frontend

```javascript
export default {
  API_URL: 'http://localhost:5000/api',  // ⚠️ Variable clé
  REQUEST_TIMEOUT: 30000,
  TOKEN_KEY: 'blacksnack_token',
  DEFAULT_PAGE_SIZE: 20
}
```

---

## 🔄 Flux de Communication

```
┌─────────────────┐
│  FRONTEND       │
│  React/TypeScript│
└────────┬────────┘
         │ Axios + config.js
         │ API_URL = http://localhost:5000/api
         ↓
┌─────────────────┐
│  MIDDLEWARE     │
│  - CORS         │
│  - Auth JWT     │
│  - Error Handler│
└────────┬────────┘
         ↓
┌─────────────────┐
│  ROUTES         │
│  /api/auth      │
│  /api/users     │
│  /api/recharges │
└────────┬────────┘
         ↓
┌─────────────────┐
│  CONTROLLERS    │
│  Business Logic │
└────────┬────────┘
         ↓
┌─────────────────┐
│  DATABASE       │
│  PostgreSQL     │
│  (via pg pool)  │
└─────────────────┘
```

---

## 📦 Dépendances Backend

```json
{
  "dependencies": {
    "express": "^4.18.2",      // Framework web
    "pg": "^8.11.3",            // Client PostgreSQL
    "bcrypt": "^5.1.1",         // Hachage mots de passe
    "jsonwebtoken": "^9.0.2",   // JWT
    "cors": "^2.8.5",           // CORS
    "helmet": "^7.1.0",         // Sécurité headers
    "morgan": "^1.10.0",        // Logger HTTP
    "dotenv": "^16.3.1"         // Variables d'environnement
  }
}
```

---

## 🗄️ Base de Données - Tables Principales

| Table | Description | Clés étrangères |
|-------|-------------|-----------------|
| `users` | Joueurs | - |
| `admins` | Administrateurs | - |
| `tournaments` | Tournois | `winner_id → users` |
| `challenges` | Défis 1v1 | `creator_id, opponent_id, winner_id → users` |
| `transactions` | Transactions financières | `user_id → users`, `payment_method_id → payment_methods` |
| `recharge_history` | Recharges manuelles | `user_id → users`, `admin_id → admins` |
| `system_transactions` | Opérations système | `admin_id → admins` |
| `payment_methods` | Méthodes de paiement | - |

---

## 🔐 Sécurité - Niveaux d'Accès

| Rôle | Permissions |
|------|------------|
| **super_admin** | Accès total (CRUD users, admins, system operations) |
| **admin** | Gestion users, recharges, transactions, tournois |
| **moderator** | Lecture users, stats, gestion contenus |

---

## 🚀 Commandes Essentielles

### Backend
```bash
cd backend
npm install                 # Installer dépendances
npm run dev                 # Démarrer en développement
npm start                   # Démarrer en production
npm run db:init             # Initialiser la base de données
```

### Frontend
```bash
cd frontend
npm install                 # Installer dépendances
npm run dev                 # Démarrer en développement
npm run build               # Build production
```

---

## ✅ Checklist Qualité Professionnelle

- ✅ **Séparation claire** : Backend et Frontend dans des dossiers distincts
- ✅ **Organisation par fonctionnalité** : config, controllers, routes, middleware
- ✅ **Configuration centralisée** : Variables d'environnement + config.js
- ✅ **API_URL dynamique** : Configuration via .env côté frontend
- ✅ **Sécurité** : JWT, bcrypt, CORS, Helmet, autorisation par rôles
- ✅ **Gestion d'erreurs** : Middleware centralisé avec custom errors
- ✅ **Base de données** : Script SQL complet avec indexes, triggers, vues
- ✅ **Documentation** : README détaillés pour backend et frontend
- ✅ **Code 100% JavaScript** : Backend sans TypeScript comme demandé

---

## 🎓 Points Forts de l'Architecture

1. **Scalabilité** : Structure modulaire facile à étendre
2. **Maintenabilité** : Code organisé par responsabilité
3. **Sécurité** : Authentification JWT + contrôle d'accès
4. **Performance** : Pool de connexions DB + indexes
5. **Developer Experience** : Configuration claire + hot reload
6. **Production-ready** : Error handling + logging + validation

---

**Développé avec professionnalisme pour Blacksnack 🎮🐍**
