# 🐍 Blacksnack - Architecture Full-Stack

## 📁 Structure du Projet

```
blacksnack/
├── backend/                          # Backend Node.js/Express
│   ├── config/
│   │   └── database.js              # Configuration de la base de données
│   ├── middleware/
│   │   └── auth.js                  # Middleware d'authentification JWT
│   ├── routes/
│   │   ├── auth.js                  # Routes d'authentification
│   │   ├── users.js                 # Routes utilisateurs
│   │   ├── transactions.js          # Routes transactions/portefeuille
│   │   ├── tournaments.js           # Routes tournois
│   │   └── challenges.js            # Routes défis
│   ├── database.sql                 # Script de création des tables
│   ├── package.json
│   ├── .env.example                 # Exemple de configuration
│   └── server.js                    # Point d'entrée du serveur
│
└── frontend/                         # Frontend React
    ├── config.js                    # ⭐ Configuration API_URL
    ├── services/
    │   └── api.js                   # Service centralisé pour les appels API
    └── components/
        ├── ExampleAuthComponent.jsx        # Exemple d'authentification
        └── ExampleTournamentsComponent.jsx # Exemple de tournois
```

---

## 🚀 Installation et Démarrage

### 1️⃣ Configuration de la Base de Données

#### PostgreSQL (Recommandé)
```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE blacksnack;

# Se connecter à la base
\c blacksnack

# Exécuter le script SQL
\i backend/database.sql
```

#### MySQL (Alternative)
```bash
# Se connecter à MySQL
mysql -u root -p

# Créer la base de données
CREATE DATABASE blacksnack;
USE blacksnack;

# Exécuter le script SQL
source backend/database.sql;
```

### 2️⃣ Configuration du Backend

```bash
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Éditer .env avec vos paramètres
nano .env
```

**Contenu du fichier `.env` :**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blacksnack
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=votre_secret_jwt_super_securise
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

```bash
# Démarrer le serveur
npm start

# OU en mode développement avec auto-reload
npm run dev
```

Le serveur démarre sur **http://localhost:5000**

### 3️⃣ Configuration du Frontend

```bash
cd frontend

# Ouvrir le fichier config.js et vérifier l'API_URL
```

**Contenu de `frontend/config.js` :**
```javascript
const config = {
  API_URL: 'http://localhost:5000/api',  // ⭐ Route vers le backend
  TOKEN_KEY: 'blacksnack_token',
  EXCHANGE_RATE: 2500
};

export default config;
```

---

## 📡 API Endpoints

### Authentification (`/api/auth`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Inscription d'un nouvel utilisateur |
| POST | `/login` | Connexion utilisateur |
| POST | `/forgot-password` | Demande de code de récupération |
| POST | `/reset-password` | Réinitialisation du mot de passe |

### Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/me` | Profil de l'utilisateur connecté | ✅ |
| GET | `/settings` | Paramètres utilisateur | ✅ |
| PUT | `/settings` | Mise à jour des paramètres | ✅ |
| GET | `/earnings` | Historique des revenus | ✅ |

### Transactions (`/api/transactions`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/` | Créer une transaction (dépôt/retrait) | ✅ |
| GET | `/` | Liste des transactions | ✅ |

### Tournois (`/api/tournaments`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Liste des tournois actifs | ❌ |
| GET | `/:id` | Détails d'un tournoi + classement | ❌ |
| POST | `/:id/join` | Rejoindre un tournoi | ✅ |
| POST | `/:id/score` | Mettre à jour son score | ✅ |

### Défis (`/api/challenges`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/` | Créer un défi | ✅ |
| GET | `/` | Liste des défis disponibles | ✅ |
| GET | `/my-challenges` | Mes défis | ✅ |
| POST | `/:id/accept` | Accepter un défi | ✅ |
| POST | `/:id/score` | Soumettre un score | ✅ |

---

## 🔑 Authentification JWT

Toutes les routes protégées nécessitent un token JWT dans le header :

```javascript
Authorization: Bearer <votre_token_jwt>
```

Le service API (`frontend/services/api.js`) gère automatiquement l'ajout du token.

---

## 💡 Exemples d'Utilisation

### Exemple 1 : Connexion

```javascript
import apiService from './services/api';

async function login() {
  try {
    const response = await apiService.login('username', 'password');
    console.log('Utilisateur connecté:', response.user);
    // Le token est automatiquement sauvegardé
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}
```

### Exemple 2 : Récupérer les tournois

```javascript
import apiService from './services/api';

async function getTournaments() {
  try {
    const tournaments = await apiService.getTournaments();
    console.log('Tournois:', tournaments);
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}
```

### Exemple 3 : Créer une transaction

```javascript
import apiService from './services/api';

async function deposit() {
  try {
    const transaction = await apiService.createTransaction({
      type: 'deposit',
      amount: 50,
      currency: 'USD',
      method: 'mobile',
      network: 'vodacom',
      phone: '+243971234567'
    });
    console.log('Transaction créée:', transaction);
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}
```

---

## 🗄️ Schéma de Base de Données

### Tables principales :

1. **users** - Informations des utilisateurs
2. **transactions** - Historique des dépôts/retraits
3. **tournaments** - Liste des tournois
4. **tournament_participants** - Participants et scores
5. **challenges** - Défis entre joueurs
6. **user_settings** - Paramètres de jeu
7. **earnings_history** - Historique des gains

Voir le fichier `backend/database.sql` pour le schéma complet.

---

## 🔧 Configuration de Production

### Backend

1. Utiliser des variables d'environnement sécurisées
2. Activer HTTPS
3. Configurer CORS correctement
4. Utiliser un serveur de base de données dédié
5. Activer les logs et monitoring

### Frontend

Modifier `frontend/config.js` pour pointer vers votre API de production :

```javascript
const config = {
  API_URL: 'https://api.votredomaine.com/api',
  // ...
};
```

---

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL/MySQL** - Base de données SQL
- **JWT** - Authentification
- **bcryptjs** - Hashage des mots de passe

### Frontend
- **React** - Framework UI
- **Fetch API** - Requêtes HTTP
- **LocalStorage** - Stockage du token

---

## 📞 Support

Pour toute question ou problème, consultez la documentation ou créez une issue.

---

## 📄 Licence

MIT License - Libre d'utilisation
