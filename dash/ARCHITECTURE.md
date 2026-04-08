# Architecture du Projet Blacksnack

## Structure des Dossiers

```
blacksnack/
│
├── frontend/                    # Application React
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── App.tsx
│   │   ├── services/           # Appels API
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── tournamentService.js
│   │   │   ├── transactionService.js
│   │   │   └── rechargeService.js
│   │   ├── utils/
│   │   └── config.js           # Configuration API_URL
│   ├── package.json
│   └── .env
│
├── backend/                     # API Node.js/Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js     # Configuration DB
│   │   │   └── config.js       # Variables d'environnement
│   │   ├── controllers/        # Logique métier
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── adminController.js
│   │   │   ├── tournamentController.js
│   │   │   ├── challengeController.js
│   │   │   ├── transactionController.js
│   │   │   ├── rechargeController.js
│   │   │   └── statsController.js
│   │   ├── models/             # Modèles (SQL queries)
│   │   │   ├── userModel.js
│   │   │   ├── adminModel.js
│   │   │   ├── tournamentModel.js
│   │   │   ├── challengeModel.js
│   │   │   ├── transactionModel.js
│   │   │   └── rechargeModel.js
│   │   ├── routes/             # Routes API
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   ├── tournamentRoutes.js
│   │   │   ├── challengeRoutes.js
│   │   │   ├── transactionRoutes.js
│   │   │   ├── rechargeRoutes.js
│   │   │   └── statsRoutes.js
│   │   ├── middleware/         # Middlewares
│   │   │   ├── authMiddleware.js
│   │   │   ├── adminMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── validator.js
│   │   ├── utils/              # Utilitaires
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   └── server.js           # Point d'entrée
│   ├── database.sql            # Script DDL
│   ├── package.json
│   └── .env
│
└── README.md
```

## Technologies Utilisées

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de données**: PostgreSQL
- **ORM/Query Builder**: pg (node-postgres)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Security**: helmet, cors, bcrypt

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Routing**: React Router

## Flux de Données

```
Frontend (React) 
    ↓ (axios + config.js)
API REST (Express)
    ↓ (pg)
PostgreSQL Database
```

## Endpoints API Principaux

### Authentification
- POST `/api/auth/login` - Connexion admin
- POST `/api/auth/logout` - Déconnexion
- GET `/api/auth/me` - Profil actuel

### Utilisateurs/Joueurs
- GET `/api/users` - Liste des joueurs
- GET `/api/users/:id` - Détails joueur
- PUT `/api/users/:id` - Modifier joueur
- DELETE `/api/users/:id` - Supprimer joueur

### Administrateurs
- GET `/api/admins` - Liste des admins
- POST `/api/admins` - Créer admin
- PUT `/api/admins/:id` - Modifier admin
- DELETE `/api/admins/:id` - Supprimer admin

### Tournois
- GET `/api/tournaments` - Liste des tournois
- POST `/api/tournaments` - Créer tournoi
- PUT `/api/tournaments/:id` - Modifier tournoi
- DELETE `/api/tournaments/:id` - Supprimer tournoi

### Transactions
- GET `/api/transactions` - Liste des transactions
- GET `/api/transactions/:id` - Détails transaction
- PUT `/api/transactions/:id/status` - Changer statut
- GET `/api/payment-methods` - Méthodes de paiement
- PUT `/api/payment-methods/:id` - Activer/désactiver méthode

### Recharges
- POST `/api/recharges` - Recharger compte joueur
- GET `/api/recharges` - Historique recharges
- POST `/api/recharges/system` - Opération système
- GET `/api/recharges/system` - Historique système

### Statistiques
- GET `/api/stats/overview` - Vue d'ensemble
- GET `/api/stats/revenue` - Revenus
- GET `/api/stats/users` - Stats utilisateurs

## Variables d'Environnement

### Backend (.env)
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blacksnack
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```
