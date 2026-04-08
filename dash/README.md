# 🎮 BLACKSNACK - Dashboard Administrateur

Plateforme de jeu Snake avec paris en argent réel - Dashboard administrateur complet avec backend Node.js et frontend React.

## 📁 Structure du Projet

```
blacksnack/
│
├── backend/                 # API Node.js/Express (100% JavaScript)
│   ├── src/
│   │   ├── config/         # Configuration (DB, JWT, CORS)
│   │   ├── controllers/    # Logique métier (auth, users, recharges)
│   │   ├── routes/         # Routes API REST
│   │   ├── middleware/     # Middlewares (auth, errors)
│   │   └── server.js       # Point d'entrée serveur
│   ├── database.sql        # Script SQL PostgreSQL
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
└── frontend/                # Application React + TypeScript
    ├── src/
    │   ├── app/            # Composants et pages
    │   ├── services/       # Services API (axios)
    │   ├── config.js       # Configuration (API_URL)
    │   └── ...
    ├── package.json
    └── README.md
```

## 🚀 Installation Rapide

### Prérequis

- **Node.js** >= 18.0
- **PostgreSQL** >= 14.0
- **npm** >= 9.0

### 1. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos paramètres

# Créer la base de données
psql -U postgres
CREATE DATABASE blacksnack;
\q

# Initialiser le schéma
npm run db:init

# Démarrer le serveur
npm run dev
```

Backend accessible sur : **http://localhost:5000**

### 2. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer l'environnement
# Créez un fichier .env avec :
# VITE_API_URL=http://localhost:5000/api

# Démarrer l'application
npm run dev
```

Frontend accessible sur : **http://localhost:5173**

## 🔑 Connexion Admin

Après initialisation de la base de données :

- **Email** : `admin@blacksnack.com`
- **Mot de passe** : `admin123`

⚠️ **Changez ces identifiants en production !**

## 🎯 Fonctionnalités

### Dashboard Administrateur
✅ Vue d'ensemble avec statistiques en temps réel  
✅ Gestion complète des utilisateurs/joueurs  
✅ Gestion des administrateurs (CRUD)  
✅ Gestion des tournois et défis  
✅ Système de recharge manuelle (3 étapes)  
✅ Opérations système (crédit/débit)  
✅ Gestion des transactions financières  
✅ Gestion des méthodes de paiement  
✅ Statistiques et graphiques interactifs  

### Méthodes de Paiement
- **Cartes Bancaires** (Visa/Mastercard) - Frais 2.5%
- **Mobile Money** - Frais 1.5%
- **Maboko (Banque)** - Gratuit

### Sécurité
- Authentification JWT
- Contrôle d'accès par rôles (Super Admin, Admin, Moderator)
- Hachage bcrypt pour les mots de passe
- Protection CORS
- Headers de sécurité (Helmet)

## 📚 Documentation

- [Backend README](./backend/README.md) - Documentation API complète
- [Installation détaillée](./INSTALLATION.md) - Guide pas à pas

## 🛠️ Technologies

### Backend
- **Runtime** : Node.js
- **Framework** : Express.js
- **Base de données** : PostgreSQL
- **Driver DB** : node-postgres (pg)
- **Auth** : JWT (jsonwebtoken)
- **Security** : bcrypt, helmet, cors

### Frontend
- **Framework** : React 18
- **Language** : TypeScript
- **Build** : Vite
- **Styling** : Tailwind CSS v4
- **HTTP Client** : Axios
- **Charts** : Recharts
- **Icons** : Lucide React

## 📡 API Endpoints Principaux

```
POST   /api/auth/login              - Connexion
GET    /api/auth/me                 - Profil actuel
GET    /api/users                   - Liste utilisateurs
POST   /api/recharges               - Recharger compte
POST   /api/recharges/system        - Opération système
GET    /api/recharges/system/balance - Solde système
```

[Voir la liste complète des endpoints](./backend/README.md#-endpoints-api)

## 🎨 Charte Graphique

- **Violet primaire** : `#7c3aed`
- **Noir** : `#000000`
- **Blanc** : `#ffffff`
- **Bleu** : `#3b82f6`

## 📝 Scripts Utiles

### Backend
```bash
npm start       # Production
npm run dev     # Développement avec nodemon
npm run db:init # Initialiser la DB
npm test        # Tests
```

### Frontend
```bash
npm run dev     # Développement
npm run build   # Build production
npm run preview # Prévisualiser build
```

## 🔒 Sécurité - Production

Avant de déployer en production :

1. ✅ Changez `JWT_SECRET` dans `.env`
2. ✅ Changez le mot de passe admin par défaut
3. ✅ Configurez `NODE_ENV=production`
4. ✅ Utilisez HTTPS
5. ✅ Configurez un reverse proxy (nginx)
6. ✅ Activez les rate limiters
7. ✅ Configurez des sauvegardes DB régulières

## 📄 Licence

MIT © Blacksnack Team - 2026

## 👥 Support

Pour toute question ou problème, vérifiez :
1. PostgreSQL est bien démarré
2. Les variables d'environnement sont correctes
3. Les ports 5000 et 5173 sont disponibles
4. Les dépendances sont bien installées
