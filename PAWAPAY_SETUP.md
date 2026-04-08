# 🔌 Configuration des Callbacks PawaPay (Blacksnack)

Ce document résume les adresses exactes à renseigner dans votre portail PawaPay Merchant pour activer les paiements Mobile Money.

## 1. Les 3 URLs à configurer
Sur PawaPay (Sandbox ou Live), vous trouverez trois champs pour les notifications de statut. Saisissez la **même URL** dans les trois cases :

| Champ dans PawaPay | URL à Saisir (Webhook) |
| :--- | :--- |
| **Deposits** | `https://[VOTRE_DOMAINE]/api/webhooks/pawapay` |
| **Payouts** | `https://[VOTRE_DOMAINE]/api/webhooks/pawapay` |
| **Refunds** | `https://[VOTRE_DOMAINE]/api/webhooks/pawapay` |

---

## 2. Étape par Étape : Obtenir votre URL en test (Localtunnel)

Puisque vous travaillez localement, vous devez simuler un domaine public.

1.  **Vérifiez le Backend** : Le serveur doit tourner sur le port `5000` (`npm run dev` dans `users/src/backend`).
2.  **Lancez le Tunnel** :
    ```bash
    npx localtunnel --port 5000
    ```
3.  **Copiez l'adresse générée** (ex: `https://abcd-123.loca.lt`).
4.  **Composez votre Webhook** : Ajoutez `/api/webhooks/pawapay` à la fin.
    *   Exemple : `https://abcd-123.loca.lt/api/webhooks/pawapay`
5.  **Collez-le dans PawaPay** : Remplissez les 3 champs (Deposits, Payouts, Refunds) sur votre portail PawaPay avec cette adresse complète.

---

## 3. Détails Techniques (Pour Développeur)
*   **Fichier de traitement** : `users/src/backend/routes/webhooks.js`
*   **Route API** : `POST /api/webhooks/pawapay`
*   **Données gérées** : `depositId`, `payoutId`, `status`, `amount`.

---

**⚠️ ATTENTION :**
Si vous redémarrez Localtunnel, l'URL changera. Pensez à **mettre à jour les 3 champs** dans le portail PawaPay à chaque nouvelle session de test.
