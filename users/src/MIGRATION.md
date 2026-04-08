# Guide de Migration - Blacksnack

## Étapes pour migrer de localStorage vers Backend/Database

### Phase 1 : Préparation

1. **Sauvegarder les données actuelles**
   ```javascript
   // Exécuter dans la console du navigateur sur l'application actuelle
   const backup = {
     users: localStorage.getItem('blacksnack_users'),
     tournaments: localStorage.getItem('blacksnack_tournaments'),
     challenges: localStorage.getItem('blacksnack_challenges'),
     // Sauvegarder toutes les autres clés pertinentes
   };
   console.log(JSON.stringify(backup));
   // Copier et sauvegarder la sortie
   ```

### Phase 2 : Installation du Backend

2. **Installer PostgreSQL ou MySQL**

3. **Créer la base de données**
   ```bash
   psql -U postgres
   CREATE DATABASE blacksnack;
   \c blacksnack
   \i backend/database.sql
   ```

4. **Installer les dépendances backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Éditer .env avec vos paramètres
   npm start
   ```

5. **Tester l'API**
   ```bash
   curl http://localhost:5000/health
   # Devrait retourner: {"status":"OK","timestamp":"..."}
   ```

### Phase 3 : Migration des Composants Frontend

6. **Modifier les composants existants un par un**

   **Avant (avec localStorage) :**
   ```javascript
   const users = JSON.parse(localStorage.getItem('blacksnack_users') || '[]');
   ```

   **Après (avec API) :**
   ```javascript
   import apiService from './services/api';
   
   const users = await apiService.getProfile();
   ```

7. **Composants à migrer dans l'ordre de priorité :**
   - [ ] Auth.tsx → Utiliser apiService.login() et apiService.register()
   - [ ] Wallet.tsx → Utiliser apiService.createTransaction()
   - [ ] Tournaments.tsx → Utiliser apiService.getTournaments()
   - [ ] Challenges.tsx → Utiliser apiService.getChallenges()
   - [ ] Profile.tsx → Utiliser apiService.getProfile()
   - [ ] Settings.tsx → Utiliser apiService.updateSettings()

### Phase 4 : Gestion de l'État

8. **Remplacer localStorage par Context API ou Redux**

   **Exemple avec Context :**
   ```javascript
   // UserContext.js
   import React, { createContext, useState, useEffect } from 'react';
   import apiService from './services/api';

   export const UserContext = createContext();

   export function UserProvider({ children }) {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       loadUser();
     }, []);

     const loadUser = async () => {
       try {
         const token = apiService.getToken();
         if (token) {
           const userData = await apiService.getProfile();
           setUser(userData);
         }
       } catch (error) {
         apiService.removeToken();
       } finally {
         setLoading(false);
       }
     };

     const login = async (username, password) => {
       const response = await apiService.login(username, password);
       setUser(response.user);
     };

     const logout = () => {
       apiService.logout();
       setUser(null);
     };

     const updateUser = (updatedUser) => {
       setUser(updatedUser);
     };

     return (
       <UserContext.Provider value={{ user, loading, login, logout, updateUser }}>
         {children}
       </UserContext.Provider>
     );
   }
   ```

### Phase 5 : Tests

9. **Tester chaque fonctionnalité**
   - [ ] Inscription / Connexion
   - [ ] Dépôt / Retrait
   - [ ] Rejoindre un tournoi
   - [ ] Créer / Accepter un défi
   - [ ] Mise à jour du profil

### Phase 6 : Déploiement

10. **Backend**
    - Déployer sur Heroku, DigitalOcean, AWS, etc.
    - Configurer la base de données en production
    - Mettre à jour les variables d'environnement

11. **Frontend**
    - Mettre à jour `config.js` avec l'URL de production
    - Déployer sur Vercel, Netlify, etc.

---

## Checklist de Migration

### Backend ✅
- [x] database.sql créé
- [x] server.js configuré
- [x] Routes API créées
- [x] Middleware d'authentification
- [x] Gestion des erreurs
- [ ] Base de données installée et configurée
- [ ] Variables d'environnement configurées
- [ ] Serveur démarré et testé

### Frontend ✅
- [x] config.js créé avec API_URL
- [x] services/api.js créé
- [x] Exemples de composants créés
- [ ] Composants existants migrés
- [ ] Context API implémenté
- [ ] Tests effectués
- [ ] Déploiement en production

---

## Scripts Utiles

### Script de Test Backend
```bash
# Tester l'inscription
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","phone":"+243971234567","password":"test123"}'

# Tester la connexion
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Tester les tournois (public)
curl http://localhost:5000/api/tournaments
```

### Script de Migration des Données
```javascript
// Script à exécuter pour migrer les données existantes
async function migrateLocalStorageToAPI() {
  // 1. Récupérer les données de localStorage
  const users = JSON.parse(localStorage.getItem('blacksnack_users') || '[]');
  
  // 2. Pour chaque utilisateur, créer un compte via l'API
  for (const user of users) {
    try {
      await apiService.register(user.username, user.phone, user.password);
      console.log(`✅ Utilisateur ${user.username} migré`);
    } catch (error) {
      console.error(`❌ Erreur migration ${user.username}:`, error);
    }
  }
  
  console.log('Migration terminée !');
}
```

---

## Avantages de la Nouvelle Architecture

✅ **Sécurité** : Mots de passe hashés, authentification JWT
✅ **Scalabilité** : Base de données SQL performante
✅ **Collaboration** : Plusieurs utilisateurs peuvent interagir en temps réel
✅ **Maintenance** : Code organisé et modulaire
✅ **Fonctionnalités** : Possibilité d'ajouter des notifications, chat, etc.

---

## Troubleshooting

### Problème : "Cannot connect to database"
**Solution :** Vérifier que PostgreSQL/MySQL est démarré et que les identifiants dans `.env` sont corrects

### Problème : "CORS Error"
**Solution :** Vérifier que `FRONTEND_URL` dans `.env` correspond à l'URL de votre frontend

### Problème : "Token invalid"
**Solution :** Le token a expiré ou est invalide, se reconnecter

### Problème : "Port already in use"
**Solution :** Changer le PORT dans `.env` ou arrêter le processus utilisant le port 5000
