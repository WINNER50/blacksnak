# 🐍 Blacksnack - Guide de Maintenance & Paiements

Ce guide récapitule les mécanismes mis en place pour sécuriser les transactions, gérer les webhooks des agrégateurs et produire les applications mobiles.

---

## 💎 1. Système de Certification des Paiements
Pour garantir l'intégrité financière, Blacksnack utilise un système de **"Certification Différée"**.

### Fonctionnement :
1.  **Initiation :** Lorsqu'un joueur ou un admin initie un dépôt/recharge via un agrégateur (Shwary/PawaPay), la transaction est créée avec le statut `pending`.
2.  **Affichage :** Dans le l'interface (Dash et Mobile), le montant de la transaction est masqué et remplacé par l'indication **"À certifier"**.
3.  **Validation :** Le solde de l'utilisateur (ou du système) **ne bouge pas** tant que le webhook de l'agrégateur n'a pas renvoyé le statut `completed`.
4.  **Confirmation :** Une fois certifiée, la somme s'affiche et les soldes sont mis à jour automatiquement.

---

## 📡 2. Gestion des Webhooks (Agrégateurs)
Les fichiers de traitement sont situés dans :
*   `users/src/backend/routes/webhooks.js` (Traitement global)
*   `dash/backend/src/routes/webhookRoutes.js` (Traitement système)

### Shwary :
*   Endpoint : `/api/webhooks/shwary`
*   Reçoit les statuts `pending`, `completed`, `failed`, `cancelled`.
*   Action sur `completed` : Crédit du joueur + Mise à jour de `recharge_history` + `transactions`.

### PawaPay :
*   Endpoint : `/api/webhooks/pawapay`
*   Action sur `COMPLETED` ou `SUCCESS` : Identique à Shwary.

---

## 🏦 3. Gestion des Retraits (Withdrawals)
Le dashboard (`dash`) permet d'effectuer des retraits pour les joueurs ou pour la trésorerie système.

### Règles de sécurité :
*   **Numéro de bénéficiaire :** Pour CHAQUE retrait, il est obligatoire de renseigner le numéro de téléphone et l'opérateur (M-Pesa, Airtel, Orange, etc.).
*   **Traçabilité :** Cette information est enregistrée dans la table `withdrawal_history` pour audit.
*   **Visibilité :** Les retraits suivent la même règle de certification. Un retrait "en attente" n'affiche pas son montant final tant qu'il n'est pas validé par le réseau.

---

## 📱 4. Application Mobile (Expo)
L'application utilise Expo et Tailwind (twrnc).

### Synchronisation :
L'app mobile interroge le profil utilisateur toutes les **5 secondes**. Elle détecte automatiquement les changements de solde dès qu'un webhook est traité par le serveur.

### Générer l'APK pour Android :
Pour produire un fichier installable sur Android, utilisez la commande suivante dans le dossier `mobile` :
```bash
npx eas-cli build --platform android --profile preview
```
*Note : Assurez-vous d'avoir configuré votre compte Expo via `npx eas-cli login`.*

---

## 💾 5. Structure de la Base de Données (Clés)
Les tables critiques ont été mises à jour avec une colonne `status` :
*   `recharge_history` : `status` (pending, completed, failed)
*   `withdrawal_history` : `status` (pending, completed, failed)
*   `system_transactions` : `status` (pending, completed, failed)

---

## 🛠 6. Maintenance & Tests
En cas de transaction "bloquée" en attente :
1.  Vérifiez les logs du serveur (`STDOUT`) pour voir si le webhook a été reçu.
2.  Dans la base de données, vous pouvez forcer le statut à `completed` manuellement si vous avez reçu la preuve de paiement bancaire, mais il est recommandé de laisser les webhooks automatiser ce processus.

---
*Dernière mise à jour : 08 Avril 2026*
