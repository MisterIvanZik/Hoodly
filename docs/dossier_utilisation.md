# 📖 Guide d'Utilisation de la Plateforme - Hoodly

Ce guide vous accompagne dans l'installation, le lancement et l'utilisation quotidienne de la plateforme collaborative de quartier **Hoodly**.

---

## 1. Accès en Production

La plateforme est entièrement déployée en production et accessible en ligne :
- **Portail Habitant (Client Web)** : **`https://hoodly.fr`**
- **Back-Office Administrateur (Web)** : **`https://admin.hoodly.fr`**

---

## 2. Installation et Lancement Rapide (Développement Local)

### 2.1. Prérequis Système
- **Node.js** version 20 ou supérieure.
- **pnpm** (gestionnaire de paquets).
- **MongoDB** en local (ou via MongoDB Atlas) et **Neo4j** (en local ou via Neo4j Aura).
- Un compte **Auth0** configuré avec une API et une application de type Single Page Application (SPA).
- Un compte **Cloudinary** pour le stockage d'images et documents.

---

### 2.2. Gestion des Secrets en Développement (`dotenvx`)
Le projet utilise **`dotenvx`** pour crypter les secrets. Avant de lancer l'application en local :
1. Récupérez la clé de déchiffrement `DOTENV_PRIVATE_KEY` auprès de l'équipe.
2. Définissez-la dans vos variables d'environnement locales ou passez-la lors de l'exécution.
3. Pour déchiffrer temporairement et générer le fichier local pour inspection : `pnpm run decrypt`.
4. Pour modifier des variables d'environnement locales : éditez le fichier `.env` puis lancez `pnpm run encrypt`.

---

### 2.3. Option 1 : Lancement Local Classique

1. **Cloner le dépôt** et se placer à la racine du projet.
2. **Lancer le Backend (NestJS)** :
   ```bash
   cd hoodly-backend
   pnpm install
   pnpm run start:dev # Utilise dotenvx run en arrière-plan
   ```
   L'API démarre sur le port `3000`.
3. **Lancer le Portail Habitant (Client)** :
   ```bash
   cd ../hoodly-frontend-client
   pnpm install
   pnpm run dev
   ```
   L'application s'ouvre sur le port `5173`.
4. **Lancer le Back-Office Admin (Web)** :
   ```bash
   cd ../hoodly-frontend-admin
   pnpm install
   pnpm run dev
   ```
   Le portail admin démarre sur le port `5174`.
5. **Lancer l'Application Desktop Administrateur (JavaFX)** :
   ```bash
   cd ../hoodly-desktop
   ./mvnw javafx:run
   ```

---

### 2.4. Option 2 : Lancement avec Docker Compose (Production localisée)

À la racine du projet, exécutez la commande suivante :
```bash
docker-compose up --build
```
- L'API backend est disponible sur `http://localhost:3000`.
- Le Portail Habitant est disponible sur `http://localhost:5173`.
- Le Back-Office Admin Web est disponible sur `http://localhost:5174`.

---

## 3. Guide de l'Habitant (Portail Client React)

Le portail habitant permet aux résidents d'échanger des services, de s'entraider, de participer à des activités de quartier et de communiquer de façon sécurisée.

### 3.1. Inscription, Connexion et Onboarding
1. Accédez à **`https://hoodly.fr`** (ou `http://localhost:5173` en local).
2. Cliquez sur **Connexion**. Vous serez redirigé vers la page sécurisée d'**Auth0** (SSO). Vous pouvez vous connecter avec vos identifiants ou via votre compte Google.
3. **Double facteur (MFA)** : S'il s'agit de votre première connexion ou d'une reconnexion après expiration, Auth0 vous demandera d'activer ou de valider votre MFA (code envoyé sur application d'authentification ou par SMS/e-mail).
4. **Flow d'onboarding** :
   - Renseignez vos informations de profil (prénom, nom, date de naissance, civilité, biographie).
   - Sélectionnez vos centres d'intérêt et compétences (jardinage, bricolage, babysitting, cours particuliers, informatique, etc.).
   - Renseignez votre localisation géographique en double-cliquant sur la carte de quartier.
   - Soumettez votre justificatif de domicile (fichier PDF) pour validation par l'administrateur. En attendant, votre statut sera défini à `pending_zone`.

---

### 3.2. Échange de Services et Système de Points
Chaque nouvel habitant commence avec un solde initial de **100 points**.

1. **Rechercher un service** : Rendez-vous sur la page **Services** pour consulter les annonces postées par vos voisins (ex. "Besoin d'aide pour tondre la pelouse", "Propose cours de mathématiques").
2. **Proposer ou demander un service** : Cliquez sur **Nouvelle Annonce**, saisissez le titre, la description, la catégorie et le nombre de points associés au service.
   - *Règle des points* : Un service payant nécessite des points de transfert (ex: 1 heure de cours particulier = 2 points, 3 heures de babysitting = 4 points).
3. **Créer un contrat obligatoire** : Si le service est payant, l'acceptation de l'offre génère automatiquement un contrat sous forme de brouillon PDF.
4. **Signer le contrat** :
   - Ouvrez la page **Contrats** et sélectionnez le contrat concerné.
   - Appliquez votre signature manuscrite dans le carré interactif prévu à cet effet.
   - Validez l'action via le code MFA (OTP) envoyé par e-mail.
   - Les points du contrat sont immédiatement placés dans un compte de **séquestre temporaire** (bloqués de votre solde).
5. **Finaliser le service** : Une fois le service rendu, cliquez sur **Marquer comme terminé** pour transférer définitivement les points en séquestre vers le solde du prestataire.

---

### 3.3. Signature de Documents PDF et Stockage
Pour tout contrat ou document d'entraide administrative :
1. Importez un document PDF dans l'onglet **Documents**.
2. Glissez-déposez les zones de signature (pour vous et votre voisin).
3. Signez le document en dessinant votre signature. Le serveur apposera visuellement votre signature à l'emplacement exact défini, sauvegardera le PDF final de façon sécurisée sur **Cloudinary**, et calculera un hash SHA-256 unique d'anti-falsification.

---

### 3.4. Événements et Recommandations (Swipe d'Intérêt)
1. Rendez-vous dans la section **Événements** du quartier.
2. **Mode Découverte (Swipe)** : Les événements à venir s'affichent sous forme de cartes.
   - Glissez (swipe) vers la **droite** si vous êtes intéressé.
   - Glissez (swipe) vers la **gauche** pour passer à l'événement suivant.
3. Les interactions de swipe alimentent instantanément le moteur de graphe Neo4j. Le bandeau de **Recommandations** affiche alors en priorité les activités les plus pertinentes pour vous, basées sur les préférences de vos voisins similaires.
4. Inscrivez-vous aux événements payants ou gratuits pour y participer.

---

### 3.5. Messagerie Instantanée
1. Ouvrez l'onglet **Messages**.
2. Sélectionnez un contact (voisin ou modérateur) pour lancer une discussion.
3. La messagerie prend en charge le texte, l'envoi de photos et l'envoi de messages vocaux (stockés sur **Cloudinary**).
4. Les indicateurs vert/gris vous informent en temps réel si vos voisins sont en ligne ou hors-ligne.

---

### 3.6. Signalement d'Incidents
Un trou sur la chaussée ? Un lampadaire en panne ?
1. Allez dans l'onglet **Incidents**.
2. Cliquez sur **Signaler un incident**.
3. Renseignez la description, choisissez une catégorie (voirie, éclairage, déchets...) et cliquez sur la carte pour définir sa localisation exacte.
4. L'incident apparaît immédiatement sur la carte du quartier pour tous les voisins et est envoyé au back-office.

---

### 3.7. Participation aux Scrutins (Votes)
1. Ouvrez l'onglet **Votes**.
2. Consultez les scrutins en cours lancés par le comité de quartier.
3. Sélectionnez votre choix et cliquez sur **Voter**. Le vote est anonyme et sécurisé. Une fois expiré, les résultats s'affichent de façon transparente.

---

## 4. Guide de l'Administrateur Web (Back-Office React)

Le portail administratif est réservé aux gestionnaires de quartier et modérateurs pour veiller à la sécurité et à la modélisation géographique.

### 4.1. Modélisation Géographique d'un Quartier
1. Accédez à **`https://admin.hoodly.fr`** (ou `http://localhost:5174` en local).
2. Allez dans l'onglet **Ouverture & Tracé des Quartiers**.
3. Utilisez l'outil de dessin de polygones sur la carte Mapbox pour délimiter les frontières géographiques d'un nouveau quartier.
4. Renseignez le nom du quartier et sauvegardez. Le système valide automatiquement que la zone ne chevauche pas un quartier existant.

### 4.2. Modération des Inscriptions et Justificatifs
1. Dans l'onglet **Candidatures**, examinez les demandes d'inscription des nouveaux habitants.
2. Visualisez le justificatif de domicile PDF fourni (hébergé sur **Cloudinary**).
3. Cliquez sur **Approuver** pour intégrer le résident au quartier (son statut passe de `pending_zone` à `in_zone` et il reçoit ses 100 points d'accueil) ou **Rejeter** en spécifiant le motif.

### 4.3. Gestion des Votes et Incidents
- **Créer un vote** : Rédigez une question, ajoutez les options de réponse possibles, définissez la date de clôture et lancez le scrutin.
- **Suivre les incidents** : Consultez la carte globale des incidents signalés par les habitants pour planifier des interventions.

---

## 5. Guide de l'Application Desktop (JavaFX)

L'application Desktop est un outil d'administration conçu pour la gestion opérationnelle et le suivi des incidents de voirie, même en situation de coupure de réseau.

### 5.1. Connexion et Première Synchronisation
1. Démarrez l'application desktop.
2. Cliquez sur **Connexion**. La boîte de dialogue Auth0 s'ouvre dans votre navigateur par défaut. Identifiez-vous.
3. Une fois connecté, l'application récupère l'historique des incidents et les statistiques du quartier. Elle s'initialise et alimente sa base de données locale (SQLite/H2).

### 5.2. Gestion des Incidents en Mode Hors-Ligne (Offline-First)
- **Consultation** : Vous pouvez naviguer dans la liste des incidents, filtrer par priorité et afficher les détails, même si votre connexion Internet est coupée.
- **Modification Hors-ligne** : Vous pouvez changer le statut d'un incident (ex: le passer de *Signalé* à *En cours de résolution*). L'action est enregistrée localement avec le statut `pending_update`.

### 5.3. Synchronisation Automatique et Résolution de Conflits
Dès que la connexion Internet est restaurée, le processus de synchronisation s'active en arrière-plan :
1. Les nouveaux incidents créés en local sont envoyés au serveur.
2. **Boîte de résolution de conflit** : Si un incident a été modifié simultanément sur le serveur (ex: par un modérateur web) et sur votre application desktop hors-ligne :
   - Une fenêtre pop-up de conflit s'affiche.
   - Elle présente la version serveur (avec l'auteur et la date de modification) et la version locale.
   - Cliquez sur **Conserver Locale** pour forcer l'application de votre changement, ou **Accepter Serveur** pour écraser votre modification locale par celle du serveur.

### 5.4. Gestion des Plugins et Thèmes
- **Thèmes** : Dans les paramètres de l'application, sélectionnez un thème (Clair, Sombre, Moderne). Les feuilles de style CSS s'appliquent immédiatement sans nécessiter de redémarrage.
- **Plugins** :
  - Déposez un fichier `.jar` de plugin dans le dossier dédié `/plugins`.
  - Dans l'onglet **Plugins**, vous verrez apparaître la nouvelle fonctionnalité (ex: export Excel des statistiques d'incidents, calendrier de présence des bénévoles).
  - Activez-la d'un simple clic pour l'ajouter à votre tableau de bord.
