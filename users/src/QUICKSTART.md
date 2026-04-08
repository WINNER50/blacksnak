# 🚀 Guide de Démarrage Rapide - Blacksnack

## En 5 minutes, lancez votre application Full-Stack !

### Prérequis ⚡
- ✅ Node.js v14+ installé
- ✅ PostgreSQL OU MySQL installé
- ✅ Terminal/Console

---

## Option 1 : Démarrage Automatique (Recommandé)

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd blacksnack

# 2. Exécuter le script d'initialisation
bash init.sh

# 3. Suivre les instructions affichées
```

---

## Option 2 : Démarrage Manuel

### Étape 1 : Configuration de la Base de Données (2 min)

#### PostgreSQL
```bash
# Démarrer PostgreSQL
psql -U postgres

# Dans psql:
CREATE DATABASE blacksnack;
\c blacksnack
\i backend/database.sql
\q
```

#### MySQL
```bash
# Démarrer MySQL
mysql -u root -p

# Dans mysql:
CREATE DATABASE blacksnack;
USE blacksnack;
source backend/database.sql;
exit
```

### Étape 2 : Configuration du Backend (1 min)

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Éditer .env (IMPORTANT!)
nano .env
```

**Modifier ces valeurs dans .env :**
```env
DB_PASSWORD=votre_mot_de_passe_base_de_données
JWT_SECRET=changez_cette_clé_secrète_par_quelque_chose_de_random
```

### Étape 3 : Démarrer le Backend (30 sec)

```bash
# Toujours dans /backend
npm start

# Vous devriez voir:
# ╔═══════════════════════════════════════╗
# ║   🐍 Serveur Blacksnack démarré       ║
# ║   Port: 5000                          ║
# ╚═══════════════════════════════════════╝
```

### Étape 4 : Tester l'API (30 sec)

```bash
# Dans un NOUVEAU terminal
cd backend
node test-api.js

# Tous les tests doivent passer ✅
```

### Étape 5 : Configuration du Frontend (30 sec)

```bash
# Ouvrir frontend/config.js
# Vérifier que API_URL = 'http://localhost:5000/api'
```

**C'est tout ! Votre backend est prêt ! 🎉**

---

## 🧪 Test Rapide

### 1. Test de Santé du Serveur
```bash
curl http://localhost:5000/health
# Retour attendu: {"status":"OK","timestamp":"..."}
```

### 2. Test d'Inscription
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","phone":"+243971234567","password":"Test123"}'
```

### 3. Test de Connexion
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123"}'
```

---

## 📱 Intégrer le Frontend

### Dans vos composants React existants

#### 1. Importer le service API
```javascript
import apiService from './services/api';
```

#### 2. Remplacer localStorage par des appels API

**Avant (localStorage) :**
```javascript
const user = JSON.parse(localStorage.getItem('blacksnack_user'));
```

**Après (API) :**
```javascript
const user = await apiService.getProfile();
```

#### 3. Exemples d'utilisation

**Connexion :**
```javascript
try {
  const response = await apiService.login(username, password);
  console.log('Connecté:', response.user);
} catch (error) {
  console.error('Erreur:', error.message);
}
```

**Récupérer les tournois :**
```javascript
const tournaments = await apiService.getTournaments();
```

**Créer une transaction :**
```javascript
await apiService.createTransaction({
  type: 'deposit',
  amount: 100,
  currency: 'USD',
  method: 'mobile',
  network: 'vodacom',
  phone: '+243971234567'
});
```

---

## 🐛 Problèmes Courants

### "Cannot connect to database"
**Solution :** Vérifiez que PostgreSQL/MySQL est démarré et que les identifiants dans `.env` sont corrects

### "Port 5000 already in use"
**Solution :** Changez le PORT dans `.env` ou arrêtez le processus sur le port 5000
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "CORS Error" dans le frontend
**Solution :** Vérifiez que `FRONTEND_URL` dans `.env` correspond à l'URL de votre frontend

### "JWT Token invalid"
**Solution :** Le token a expiré, reconnectez-vous

---

## 📚 Documentation Complète

- **README.md** - Documentation principale et API endpoints
- **ARCHITECTURE.md** - Architecture détaillée du projet
- **MIGRATION.md** - Guide pour migrer depuis localStorage

---

## 🎯 Prochaines Étapes

1. ✅ Backend fonctionnel
2. 📱 Migrer vos composants React pour utiliser l'API
3. 🎨 Tester toutes les fonctionnalités
4. 🚀 Déployer en production

---

## 💡 Commandes Utiles

```bash
# Démarrer le backend
cd backend && npm start

# Démarrer en mode développement (auto-reload)
cd backend && npm run dev

# Tester l'API
cd backend && node test-api.js

# Installer toutes les dépendances depuis la racine
npm run install:all
```

---

## 🆘 Besoin d'Aide ?

1. Consultez **README.md** pour les détails de l'API
2. Consultez **ARCHITECTURE.md** pour comprendre la structure
3. Consultez **MIGRATION.md** pour migrer depuis localStorage
4. Vérifiez les logs du serveur pour les erreurs

---

## ✨ Félicitations !

Vous avez maintenant une application Full-Stack professionnelle avec :
- ✅ Backend Node.js/Express
- ✅ Base de données SQL
- ✅ API REST complète
- ✅ Authentification JWT sécurisée
- ✅ Architecture séparée et scalable

**Bon développement ! 🐍🎮**
