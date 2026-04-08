# 🚀 GUIDE DE DÉMARRAGE RAPIDE - BLACKSNACK

## ⚡ Installation en 5 Minutes

### Prérequis
- Node.js >= 18.0
- PostgreSQL >= 14.0
- npm >= 9.0

---

## 📝 Étape 1 : Cloner et Installer

```bash
# Cloner le projet
git clone https://github.com/votre-repo/blacksnack.git
cd blacksnack

# Installer les dépendances backend
cd backend
npm install

# Installer les dépendances frontend
cd ../frontend
npm install
```

---

## 🗄️ Étape 2 : Configurer la Base de Données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql, créer la base
CREATE DATABASE blacksnack;
\q

# Revenir au dossier backend
cd backend

# Initialiser le schéma (exécute database.sql)
npm run db:init
```

✅ **Base de données créée avec** :
- 12 tables
- Indexes d'optimisation
- Triggers automatiques
- Compte admin par défaut

---

## ⚙️ Étape 3 : Configuration Environnement

### Backend

```bash
cd backend

# Copier le template
cp .env.example .env

# Éditer .env
nano .env
```

**Contenu minimal du fichier `.env` :**

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=blacksnack
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=changez_moi_en_production_123456789
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### Frontend

```bash
cd frontend

# Créer le fichier .env
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

---

## 🚀 Étape 4 : Démarrer les Serveurs

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

✅ **Backend démarré sur** : `http://localhost:5000`

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

✅ **Frontend démarré sur** : `http://localhost:5173`

---

## 🔑 Étape 5 : Première Connexion

Ouvrez votre navigateur : `http://localhost:5173`

**Identifiants par défaut** :
- **Email** : `admin@blacksnack.com`
- **Mot de passe** : `admin123`

⚠️ **Important** : Changez ces identifiants après la première connexion !

---

## 🧪 Vérification de l'Installation

### Test Backend

```bash
# Health check
curl http://localhost:5000/health

# Réponse attendue :
# {"status":"OK","timestamp":"...","environment":"development"}
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blacksnack.com","password":"admin123"}'

# Réponse attendue : token JWT
```

---

## 📊 Étape 6 : Explorer le Dashboard

Une fois connecté, vous avez accès à :

1. **Dashboard** - Vue d'ensemble avec statistiques
2. **Utilisateurs** - Gestion des joueurs
3. **Tournois** - Création et gestion
4. **Défis** - Suivi des défis 1v1
5. **Transactions** - Historique financier
6. **Recharge** - Recharger comptes joueurs
7. **Administrateurs** - Gestion des admins
8. **Statistiques** - Graphiques détaillés

---

## 🛠️ Commandes Utiles

### Backend

```bash
npm run dev         # Développement avec hot-reload
npm start           # Production
npm run db:init     # Réinitialiser la DB
npm test            # Lancer les tests
```

### Frontend

```bash
npm run dev         # Développement
npm run build       # Build production
npm run preview     # Prévisualiser le build
npm run lint        # Vérifier le code
```

---

## 🔧 Résolution des Problèmes Courants

### ❌ Erreur : "Cannot connect to database"

**Solution** :
```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# Démarrer PostgreSQL
sudo systemctl start postgresql

# Vérifier les identifiants dans .env
```

### ❌ Erreur : "Port 5000 already in use"

**Solution** :
```bash
# Changer le port dans backend/.env
PORT=5001

# Mettre à jour frontend/.env
VITE_API_URL=http://localhost:5001/api
```

### ❌ Erreur : "CORS policy blocked"

**Solution** :
```bash
# Vérifier CORS_ORIGIN dans backend/.env
CORS_ORIGIN=http://localhost:5173

# Redémarrer le backend
```

### ❌ Erreur : "JWT token invalid"

**Solution** :
```bash
# Se déconnecter et reconnecter
# Ou effacer le localStorage du navigateur
localStorage.clear()
```

---

## 📚 Documentation Complète

- **[README Principal](./README.md)** - Vue d'ensemble
- **[STRUCTURE.md](./STRUCTURE.md)** - Architecture détaillée
- **[Backend README](./backend/README.md)** - API documentation
- **[INSTALLATION.md](./INSTALLATION.md)** - Guide complet

---

## 🎯 Prochaines Étapes

1. ✅ Changer le mot de passe admin par défaut
2. ✅ Ajouter des utilisateurs de test
3. ✅ Créer votre premier tournoi
4. ✅ Explorer les API endpoints
5. ✅ Personnaliser la configuration

---

## 💡 Conseils

- **Développement** : Utilisez toujours `npm run dev` pour le hot-reload
- **Production** : Configurez `NODE_ENV=production` avant le déploiement
- **Sécurité** : Changez `JWT_SECRET` en production
- **Performance** : Activez le caching en production
- **Monitoring** : Consultez les logs régulièrement

---

## 🆘 Support

En cas de problème :

1. Vérifiez les logs du backend : `backend/logs/`
2. Consultez la console du navigateur (F12)
3. Vérifiez les variables d'environnement
4. Redémarrez les deux serveurs

---

## ✅ Checklist de Démarrage

- [ ] PostgreSQL installé et démarré
- [ ] Base de données `blacksnack` créée
- [ ] Schéma SQL initialisé (`npm run db:init`)
- [ ] Backend `.env` configuré
- [ ] Frontend `.env` configuré
- [ ] Backend démarré (`npm run dev`)
- [ ] Frontend démarré (`npm run dev`)
- [ ] Connexion admin réussie
- [ ] Mot de passe admin changé

---

**Prêt à développer ! 🎮🐍**

Bon développement avec Blacksnack !
