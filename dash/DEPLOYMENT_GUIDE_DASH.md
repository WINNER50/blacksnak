# 🚀 Guide de Déploiement - Blacksnack Dashboard

Ce guide explique comment déployer le backend et le frontend du projet Blacksnack.

## 📋 Prérequis en Production

1.  **Base de Données** : Un serveur MySQL (actuellement configuré pour AlwaysData).
2.  **Stockage d'Images** : Un compte [Cloudinary](https://cloudinary.com/) (pour les avatars).
3.  **Hébergement Backend** : Railway, Render, Heroku ou VPS (Node.js).
4.  **Hébergement Frontend** : Vercel, Netlify ou Hostinger (React/Vite).

---

## 🛠️ Étape 1 : Hébergement du Backend

### 1. Préparer l'environnement
Sur votre plateforme d'hébergement, créez un nouveau service Node.js pointant vers le dossier `dash/backend`.

### 2. Configurer les Variables d'Environnement
Ajoutez les variables suivantes dans les paramètres de votre service :

| Clé | Valeur Exemple |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `5001` |
| `DB_HOST` | `mysql-winner55.alwaysdata.net` |
| `DB_USER` | `winner55` |
| `DB_PASSWORD` | `SUPERface22` |
| `DB_NAME` | `winner55_snak` |
| `JWT_SECRET` | `votre_cle_secrete` |
| `CORS_ORIGIN` | `*` (ou votre URL frontend une fois déployée) |
| `CLOUDINARY_CLOUD_NAME` | `djhq6legc` |
| `CLOUDINARY_API_KEY` | `491628491696291` |
| `CLOUDINARY_API_SECRET` | `PohiW4vr2wMqZgtuJNM4dPdczcs` |

### 3. Commandes de Démarrage
- **Install** : `npm install`
- **Start** : `npm start`

---

## 💻 Étape 2 : Hébergement du Frontend

### 1. Configuration
Le frontend est situé dans le dossier `dash/`.

### 2. Variables d'Environnement
Ajoutez la variable suivante lors du build :

| Clé | Valeur |
| :--- | :--- |
| `VITE_API_URL` | `https://votre-backend-deploye.com/api` |

### 3. Commandes de Build
- **Build Command** : `npm install && npm run build`
- **Output Directory** : `dist`

---

## 🔒 Sécurité
J'ai mis à jour `backend/src/config/config.js` pour qu'il n'ait plus de mots de passe codés en dur. Assurez-vous que votre fichier `.env` sur le serveur contient les bonnes informations.
