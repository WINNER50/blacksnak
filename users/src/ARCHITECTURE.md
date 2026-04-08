# 📂 Arborescence Complète du Projet Blacksnack

```
blacksnack/
│
├── 📁 backend/                           # Backend Node.js/Express + SQL
│   ├── 📁 config/
│   │   └── database.js                  # Configuration PostgreSQL/MySQL
│   │
│   ├── 📁 middleware/
│   │   └── auth.js                      # Middleware JWT pour routes protégées
│   │
│   ├── 📁 routes/
│   │   ├── auth.js                      # Routes : /api/auth/*
│   │   │                                  # - POST /register
│   │   │                                  # - POST /login
│   │   │                                  # - POST /forgot-password
│   │   │                                  # - POST /reset-password
│   │   │
│   │   ├── users.js                     # Routes : /api/users/*
│   │   │                                  # - GET /me
│   │   │                                  # - GET /settings
│   │   │                                  # - PUT /settings
│   │   │                                  # - GET /earnings
│   │   │
│   │   ├── transactions.js              # Routes : /api/transactions/*
│   │   │                                  # - POST / (créer transaction)
│   │   │                                  # - GET / (liste transactions)
│   │   │
│   │   ├── tournaments.js               # Routes : /api/tournaments/*
│   │   │                                  # - GET / (liste tournois)
│   │   │                                  # - GET /:id (détails + classement)
│   │   │                                  # - POST /:id/join
│   │   │                                  # - POST /:id/score
│   │   │
│   │   └── challenges.js                # Routes : /api/challenges/*
│   │                                      # - POST / (créer défi)
│   │                                      # - GET / (liste défis)
│   │                                      # - GET /my-challenges
│   │                                      # - POST /:id/accept
│   │                                      # - POST /:id/score
│   │
│   ├── database.sql                     # ⭐ Script SQL de création des tables
│   ├── package.json                     # Dépendances backend
│   ├── .env.example                     # Exemple de configuration
│   ├── .gitignore                       # Fichiers à ignorer
│   ├── test-api.js                      # Script de test de l'API
│   └── server.js                        # ⭐ Point d'entrée du serveur
│
├── 📁 frontend/                          # Frontend React
│   │
│   ├── config.js                        # ⭐⭐⭐ Configuration API_URL
│   │                                      # const config = {
│   │                                      #   API_URL: 'http://localhost:5000/api'
│   │                                      # }
│   │
│   ├── 📁 services/
│   │   └── api.js                       # ⭐ Service centralisé pour appels API
│   │                                      # - Classe ApiService
│   │                                      # - Gestion du token JWT
│   │                                      # - Méthodes pour toutes les routes
│   │
│   └── 📁 components/
│       ├── ExampleAuthComponent.jsx     # Exemple : Authentification
│       └── ExampleTournamentsComponent.jsx # Exemple : Tournois
│
├── README.md                            # Documentation principale
├── MIGRATION.md                         # Guide de migration
└── ARCHITECTURE.md                      # Ce fichier
```

---

## 📊 Architecture Détaillée

### 🎯 Backend (Node.js/Express)

#### 1. Serveur Principal (`server.js`)
```javascript
- Initialisation d'Express
- Configuration des middlewares (CORS, Body-Parser)
- Montage des routes
- Gestion des erreurs
- Démarrage du serveur sur le port défini
```

#### 2. Configuration Base de Données (`config/database.js`)
```javascript
- Connexion PostgreSQL ou MySQL
- Pool de connexions
- Export du pool pour utilisation dans les routes
```

#### 3. Middleware d'Authentification (`middleware/auth.js`)
```javascript
- Vérification du token JWT dans les headers
- Extraction de l'userId et username
- Protection des routes sensibles
```

#### 4. Routes API

**auth.js** - Authentification
- Inscription avec hashage bcrypt
- Connexion avec génération JWT
- Récupération de mot de passe (simulation WhatsApp)
- Réinitialisation de mot de passe

**users.js** - Gestion utilisateurs
- Récupération du profil
- Paramètres de jeu (vitesse)
- Historique des revenus

**transactions.js** - Portefeuille
- Création de transaction (dépôt/retrait)
- Vérification du solde
- Mise à jour automatique du solde utilisateur
- Historique des transactions

**tournaments.js** - Tournois
- Liste des tournois actifs
- Détails + classement d'un tournoi
- Inscription (avec paiement des frais)
- Mise à jour du score

**challenges.js** - Défis
- Création de défi (mise en jeu de l'argent)
- Liste des défis disponibles
- Acceptation d'un défi
- Soumission des scores
- Détermination automatique du gagnant
- Distribution des gains

#### 5. Base de Données SQL (`database.sql`)

**Tables :**
1. `users` - Comptes utilisateurs
2. `transactions` - Historique financier
3. `tournaments` - Tournois actifs
4. `tournament_participants` - Inscriptions + scores
5. `challenges` - Défis entre joueurs
6. `user_settings` - Paramètres de jeu
7. `earnings_history` - Historique des gains

**Relations :**
- users ← transactions (1:N)
- tournaments ← tournament_participants (1:N)
- users ← tournament_participants (1:N)
- users ← challenges (1:N créateur, 1:N adversaire)
- users ← user_settings (1:1)
- users ← earnings_history (1:N)

---

### 🎨 Frontend (React)

#### 1. Configuration (`config.js`)
```javascript
⭐ FICHIER CLÉ ⭐
- API_URL : URL du backend (localhost en dev, domaine en prod)
- TOKEN_KEY : Clé de stockage du JWT
- EXCHANGE_RATE : Taux de change USD/CDF
- Paramètres du jeu
```

#### 2. Service API (`services/api.js`)
```javascript
Classe ApiService qui encapsule :
- Gestion du token (get/set/remove)
- Méthode request() générique
- Méthodes spécifiques pour chaque endpoint :
  * register, login, forgotPassword, resetPassword
  * getProfile, getSettings, updateSettings
  * createTransaction, getTransactions
  * getTournaments, joinTournament, updateTournamentScore
  * createChallenge, acceptChallenge, submitChallengeScore
```

#### 3. Composants Exemples
- **ExampleAuthComponent.jsx** : Formulaire login/register
- **ExampleTournamentsComponent.jsx** : Liste et inscription aux tournois

---

## 🔄 Flux de Données

### Inscription/Connexion
```
Frontend                Backend                Database
   |                       |                      |
   |--register()---------->|                      |
   |                       |--INSERT users------->|
   |                       |<--user created-------|
   |<--{token, user}-------|                      |
   |                       |                      |
Store token in localStorage
```

### Transaction (Dépôt/Retrait)
```
Frontend                Backend                Database
   |                       |                      |
   |--createTransaction()->|                      |
   |   (with JWT token)    |--BEGIN TRANSACTION->|
   |                       |--INSERT transactions-|
   |                       |--UPDATE users.balance|
   |                       |--COMMIT------------->|
   |<--success message-----|                      |
```

### Tournoi
```
Frontend                Backend                Database
   |                       |                      |
   |--getTournaments()---->|                      |
   |                       |--SELECT tournaments->|
   |<--tournaments list----|                      |
   |                       |                      |
   |--joinTournament()---->|                      |
   |   (with JWT)          |--BEGIN TRANSACTION->|
   |                       |--UPDATE users.balance|
   |                       |--INSERT participant--|
   |                       |--UPDATE tournament---|
   |                       |--COMMIT------------->|
   |<--success-------------|                      |
```

---

## 🔐 Sécurité

### Backend
✅ Mots de passe hashés avec bcrypt (10 rounds)
✅ Authentification JWT (expiration 30 jours)
✅ Middleware de protection des routes
✅ Validation des données en entrée
✅ Transactions SQL (ACID)
✅ CORS configuré

### Frontend
✅ Token stocké en localStorage (HTTPS en prod)
✅ Envoi automatique du token dans les headers
✅ Gestion des erreurs et expiration
✅ Déconnexion automatique si token invalide

---

## 🚀 Déploiement

### Backend
**Options :**
- Heroku (facile)
- DigitalOcean (flexible)
- AWS EC2 (scalable)
- Render (gratuit)

**Base de données :**
- Heroku Postgres
- AWS RDS
- DigitalOcean Managed Database

### Frontend
**Options :**
- Vercel (recommandé pour React)
- Netlify
- GitHub Pages

**Configuration :**
Mettre à jour `frontend/config.js` :
```javascript
const config = {
  API_URL: 'https://api.blacksnack.com/api'
};
```

---

## 📈 Évolutions Futures

### Possibilités d'extension :
1. **WebSockets** pour le temps réel (tournois live)
2. **Notifications** push
3. **Chat** entre joueurs
4. **Système de classement** global
5. **Achievements** et badges
6. **API WhatsApp** réelle pour récupération mot de passe
7. **Intégration Mobile Money** réelle
8. **Analytics** et statistiques
9. **Admin panel** pour gérer les tournois
10. **Multi-langue**

---

## 🧪 Tests

### Backend
```bash
# Test manuel avec le script fourni
node backend/test-api.js

# Test avec curl
curl http://localhost:5000/health
```

### Frontend
```javascript
import apiService from './services/api';

// Test connexion
await apiService.login('username', 'password');

// Test tournois
const tournaments = await apiService.getTournaments();
console.log(tournaments);
```

---

## 📞 Points de Contact

### Backend
- Port : 5000 (configurable)
- Base URL : http://localhost:5000
- API Base : http://localhost:5000/api

### Frontend
- Port : 3000 (React default)
- Config : frontend/config.js

---

## ✅ Checklist de Mise en Production

### Backend
- [ ] Variables d'environnement sécurisées
- [ ] Base de données de production configurée
- [ ] HTTPS activé
- [ ] CORS correctement configuré
- [ ] Logs et monitoring activés
- [ ] Backup automatique de la base
- [ ] Rate limiting implémenté

### Frontend
- [ ] API_URL pointant vers production
- [ ] Build optimisé (npm run build)
- [ ] Variables sensibles retirées
- [ ] SEO optimisé
- [ ] Performance testée
- [ ] PWA configuré (optionnel)

---

**Dernière mise à jour :** 2024
**Version :** 1.0.0
