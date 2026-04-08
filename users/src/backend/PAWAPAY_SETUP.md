# Configuration des Rappels PawaPay (Callbacks/Webhooks)

Ce document explique comment configurer les notifications de paiement automatique pour Blacksnack via PawaPay.

## 1. Pourquoi ces Rappels ?
PawaPay utilise des "callbacks" pour notifier votre serveur du statut final d'un paiement (Dépôt, Retrait, Remboursement). Sans cette configuration, le solde des utilisateurs ne se mettra pas à jour automatiquement dans l'application mobile.

## 2. Configuration sur le Portail PawaPay
Dans votre tableau de bord PawaPay Merchant (ou Sandbox), vous devez renseigner l'URL de rappel pour les opérations suivantes. Utilisez la **même URL** pour toutes les opérations :

- **Deposits Callback URL**
- **Payouts Callback URL**
- **Refunds Callback URL**

### Valeur de l'URL :
`https://[VOTRE_DOMAINE_PUBLIC]/api/webhooks/pawapay`

---

## 3. Test Local avec Ngrok
Si vous développez localement sur votre ordinateur (`localhost`), PawaPay ne peut pas contacter votre serveur directement. Vous devez utiliser **ngrok**.

### Étapes :
1.  **Lancer le serveur backend** : Assurez-vous que le serveur tourne sur le port `5000`.
2.  **Lancer ngrok** :
    ```bash
    ngrok http 5000
    ```
3.  **Copier l'URL Forwarding** : Ngrok va générer une adresse comme `https://abc-123.ngrok-free.app`.
4.  **Enregistrer l'URL dans PawaPay** : Ajoutez `/api/webhooks/pawapay` à l'adresse ngrok.
    *   Exemple : `https://abc-123.ngrok-free.app/api/webhooks/pawapay`

---

## 4. Détails Techniques (Backend)
Le code qui gère la réception des données se trouve dans :
`src/backend/routes/webhooks.js`

- **Endpoint** : `POST /api/webhooks/pawapay`
- **Fonctionnement** :
    - Identifie la transaction via `depositId` ou `payoutId`.
    - Vérifie le statut (`COMPLETED`, `FAILED`, etc.).
    - Met à jour la table `transactions` et ajuste le `balance_usd` de l'utilisateur.

---

## 5. Recommandations de Sécurité (Production)
Une fois en production :
1.  **Vérification de Signature** : Modifiez le fichier `webhooks.js` pour vérifier la signature envoyée par PawaPay à l'aide de votre `webhook_secret` pour éviter les fausses requêtes.
2.  **HTTPS Obligatoire** : Assurez-vous que votre domaine public utilise le protocole `https://`.
