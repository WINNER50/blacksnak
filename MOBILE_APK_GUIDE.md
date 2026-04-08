# 📱 Guide : Transformer Mobile Blacksnack en fichier APK

Ce guide explique comment générer un fichier `.apk` installable directement sur n'importe quel téléphone Android en utilisant Expo et EAS Build.

---

## 🚀 Étape 1 : Prérequis
Avant de commencer, assure-toi d'avoir un compte sur [expo.dev](https://expo.dev/). C'est gratuit et nécessaire pour compiler l'application.

## 🔑 Étape 2 : Connexion à Expo
Ouvre un terminal dans le dossier `mobile` et connecte-toi à ton compte :
```bash
npx eas-cli login
```
*Saisis tes identifiants Expo lorsqu'ils te sont demandés.*

## ⚙️ Étape 3 : Configuration du Projet (Une seule fois)
Si c'est la première fois que tu buildes, lance cette commande pour lier ton dossier local à ton projet Expo :
```bash
npx eas-cli build:configure
```

## 🏗️ Étape 4 : Lancer la génération de l'APK
Pour créer le fichier APK, lance la commande suivante :
```bash
npx eas-cli build --platform android --profile preview
```

### Pourquoi cette commande ?
*   **`--platform android`** : Cible Android.
*   **`--profile preview`** : Utilise la configuration que j'ai créée dans `eas.json` qui force la sortie en format `.apk` (installable) plutôt qu'en `.aab` (Play Store).

## ⏳ Étape 5 : Attente et Téléchargement
1.  Le terminal va te poser quelques questions (clique sur "Yes" pour tout ce qui concerne les "Android Keystore").
2.  La compilation va se lancer sur les serveurs d'Expo (cela prend entre 5 et 10 minutes).
3.  Une fois terminé, le terminal affichera un **Lien de téléchargement** et un **QR Code**.
4.  Scanne le QR Code avec ton téléphone ou clique sur le lien pour télécharger le fichier `application.apk`.

---

## 🛠 En cas d'erreur
*   **Erreur de login** : Vérifie ton mot de passe sur expo.dev.
*   **Erreur de dépendances** : Lance `npm install` dans le dossier `mobile` avant de relancer le build.
*   **Identifiant unique** : Si Expo demande un "Android Package Name", saisis par exemple : `com.blacksank.app`.

---
*Guide généré pour Blacksnack - 08 Avril 2026*
