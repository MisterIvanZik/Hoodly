# 🏘️ Dossier Technique Complet - Hoodly

Ce document présente l'architecture technique, les choix technologiques, la modélisation des données et les détails d'implémentation de la plateforme collaborative de quartier **Hoodly**.

---

## 1. Architecture Applicative Globale

Hoodly est conçu selon une architecture découplée, conteneurisée et déployée dans le cloud. Elle intègre des clients Web (Habitant et Administrateur), une API REST centralisée, deux moteurs de persistance (MongoDB pour le transactionnel et les documents, Neo4j pour les recommandations sociales), ainsi qu'un client lourd JavaFX fonctionnant en mode déconnecté (Offline-first) et synchronisé.

---

## 2. Déploiement en Production (Railway)

Pour la mise en production, l'infrastructure de Hoodly a été déployée sur la plateforme Cloud **Railway** en exploitant nos configurations Docker.

- **Portail Habitant** : Déployé et accessible à l'adresse **`https://hoodly.fr`**. Le conteneur compile le projet React avec Vite et utilise un serveur Nginx pour servir les assets statiques avec des règles de routage SPA adaptées.
- **Back-Office Administrateur** : Déployé et accessible à l'adresse **`https://admin.hoodly.fr`**. Il utilise la même architecture de conteneur optimisée que le portail client.
- **API Backend NestJS** : Déployée sur un service Railway, connectée à une base MongoDB Atlas et un cluster Neo4j Aura. L'API expose sa documentation interactive OpenAPI via Swagger pour le développement et la validation des contrats d'interface.

---

## 3. Sécurité et Secrets de Configuration (`dotenvx`)

Afin de garantir un niveau de sécurité professionnel lors du développement collaboratif au sein de l'équipe (Ivan Zazic, Tom Georgin, Clara Louise Lisika), nous avons implémenté **`dotenvx`** de manière rigoureuse.

### Principes d'utilisation de `dotenvx`
Plutôt que de partager des variables d'environnement en clair ou de risquer de commettre des clés privées ou des tokens Auth0/Cloudinary sensibles sur GitHub, les secrets sont cryptés directement dans des fichiers `.env` chiffrés.
- **Chiffrement** : La commande `dotenvx encrypt` génère une clé de déchiffrement privée (`DOTENV_PRIVATE_KEY`) et convertit les secrets du fichier `.env` en valeurs chiffrées indéchiffrables sans la clé.
- **Déploiement en Production** : Sur Railway, seule la clé privée `DOTENV_PRIVATE_KEY` correspondante est configurée dans le tableau de bord de Railway. Au démarrage, l'application exécute `dotenvx run --` pour déchiffrer à la volée les variables requises par le conteneur en mémoire, sans jamais écrire les secrets en clair sur le disque du conteneur.
- **Scripts du package** :
  ```json
  "start:dev": "dotenvx run -- nest start --watch",
  "encrypt": "dotenvx encrypt",
  "decrypt": "dotenvx decrypt"
  ```

---

## 4. Stockage Distant des Médias et Documents (Cloudinary)

L'application manipule de nombreux fichiers sensibles et médias lourds. Pour soulager les bases de données transactionnelles et éviter de stocker des fichiers sur les instances éphémères de nos conteneurs Railway, nous utilisons le service **Cloudinary** :

1. **Documents et Justificatifs** : Les justificatifs de domicile PDF transmis lors de l'onboarding et les pièces d'identité sont téléversés via l'API NestJS (`multer` et le SDK Cloudinary) vers des dossiers privés de notre espace Cloudinary.
2. **Contrats signés** : Une fois la double signature apposée sur le contrat par le prestataire et le client via `pdf-lib`, le fichier PDF compilé contenant l'image des signatures est envoyé sur Cloudinary. Le lien sécurisé retourné est enregistré dans le champ `fileUrl` du document MongoDB.
3. **Photos de Profil et d'Événements** : Les photos de profil des utilisateurs, les images d'illustration des événements et les photos partagées dans la messagerie multimédia instantanée transitent par Cloudinary qui optimise les images à la volée pour la bande passante web.

---

## 5. Modélisation des Bases de Données (MongoDB)

Voici la description complète de l'ensemble des collections MongoDB utilisées dans le backend NestJS, structurées par les schémas Mongoose.

### 5.1. Collection `users` (Schéma `User`)
Stocke les profils des habitants, modérateurs et administrateurs du quartier.
- `auth0Id` (String, requis, unique) : Identifiant unique de l'utilisateur fourni par le SSO Auth0.
- `email` (String, requis) : Adresse e-mail de l'habitant.
- `name` (String, optionnel) : Nom complet ou pseudonyme.
- `firstName` / `lastName` (String, optionnels) : Prénom et nom de famille officiels de l'habitant.
- `picture` (String, optionnel) : URL de la photo de profil (Cloudinary).
- `phone` (String, optionnel) : Numéro de téléphone portable (utilisé pour les notifications ou MFA).
- `birthDate` (String, optionnel) : Date de naissance.
- `civility` (String, optionnel) : Civilité de l'utilisateur (M., Mme, etc.).
- `bio` (String, optionnel) : Biographie de présentation aux voisins.
- `role` (String, énumération: `user`, `moderator`, `admin`) : Rôle applicatif déterminant les droits d'accès.
- `isActive` (Boolean, par défaut: `true`) : État du compte (actif/suspendu).
- `zoneId` (ObjectId, ref: `Zone`, optionnel) : Référence du quartier auquel appartient l'habitant.
- `zoneStatut` (String, énumération: `no_zone`, `pending_zone`, `in_zone`) : Statut d'intégration au quartier géographique.
- `points` (Number, requis, par défaut: `100`) : Solde actuel de points utilisable pour s'échanger des services.
- `interests` (Array de Strings) : Liste des centres d'intérêt de l'habitant (utilisés pour les recommandations).
- `location` (Objet GeoJSON, optionnel) : Coordonnées cartographiques de sa résidence `{ type: String, coordinates: [Number] }`.
- `claimedMissions` (Array de Strings) : Liste des missions ou services revendiqués/en cours.
- `refusalReason` / `refusalType` (Strings, optionnels) : Raison du rejet de validation du compte ou d'accès à une zone par le modérateur.

### 5.2. Collection `services` (Schéma `Service`)
Modélise les petites annonces d'entraide postées par les voisins.
- `titre` (String, requis) : Titre de l'annonce.
- `description` (String, requis) : Description détaillée du besoin ou de la proposition.
- `type` (String, énumération: `offre`, `demande`) : Nature du service.
- `categorie` (String, requis) : Catégorie d'activité (Bricolage, babysitting, cours, etc.).
- `gratuit` (Boolean, par défaut: `true`) : Indique si le service est bénévole ou payant en points.
- `points` (Number, optionnel) : Nombre de points requis pour la réalisation du service.
- `statut` (String, énumération: `actif`, `en_cours`, `termine`, `annule`) : État actuel de l'annonce.
- `createurId` (ObjectId, ref: `User`, requis) : Référence de l'initiateur de l'annonce.
- `zoneId` (ObjectId, ref: `Zone`, requis) : Quartier où le service est proposé.
- `responderId` (ObjectId, ref: `User`, optionnel) : Référence du voisin qui a accepté de rendre ou de recevoir le service.
- `refusedResponders` (Array d'ObjectIds, ref: `User`) : Utilisateurs rejetés par le créateur pour ce service.
- `realisationValidee` (Boolean, par défaut: `false`) : Confirmation finale que le service a été correctement exécuté.
- `recurrente` (Boolean, optionnel) : Indique si le service se répète régulièrement.
- `disponibilites` (Array de Strings) : Plages horaires de disponibilité.
- `datePlanification` (String, optionnel) : Date convenue pour le service.
- `contractId` (ObjectId, ref: `Contract`, optionnel) : Référence du contrat légal généré pour ce service payant.
- `photoUrl` (String, optionnel) : Image associée au service (Cloudinary).

### 5.3. Collection `contracts` (Schéma `Contract`)
Gère l'accord transactionnel et la double signature électronique.
- `clientId` (ObjectId, ref: `User`, requis) : Habitant demandant le service.
- `providerId` (ObjectId, ref: `User`, requis) : Habitant effectuant le service.
- `serviceId` (ObjectId, ref: `Service`, optionnel) : Service d'origine.
- `eventId` (ObjectId, ref: `Event`, optionnel) : Événement lié (si applicable).
- `title` (String, requis) : Intitulé du contrat.
- `terms` (String, requis) : Conditions générales et particulières rédigées.
- `pricePoints` (Number, requis, par défaut: `0`) : Montant en points devant être séquestré puis transféré.
- `status` (String, énumération: `pending`, `signed`, `completed`, `cancelled`) : État du contrat.
- `templateDocumentId` (ObjectId, ref: `Document`, requis) : PDF d'origine vierge (avec les clauses).
- `signedDocumentId` (ObjectId, ref: `Document`, optionnel) : PDF final contenant les signatures fusionnées.
- `signatureZones` (Array) : Liste des coordonnées cartésiennes de signature sur le PDF (`page`, `x`, `y`, `width`, `height`, `assignee`).
- `clientSignature` / `providerSignature` (Objets) : Contiennent l'état de signature (`signed`, `signedAt`), l'adresse IP du signataire (`ipAddress`), le hash d'authentification (`hash`), et l'image du tracé manuscrit (`signatureImage`).
- `pointsEscrowed` (Boolean, par défaut: `false`) : Confirme si les points sont actuellement bloqués en séquestre.

### 5.4. Collection `documents` (Schéma `Document`)
Référence les fichiers PDF stockés sur Cloudinary et assure leur traçabilité.
- `ownerId` (ObjectId, ref: `User`, requis) : Propriétaire ou créateur du fichier.
- `title` (String, requis) : Nom du fichier.
- `fileUrl` (String, requis) : URL publique sécurisée de stockage (Cloudinary).
- `pdfHash` (String, requis) : Empreinte cryptographique unique SHA-256 calculée lors du téléversement pour garantir l'intégrité.
- `type` (String, énumération: `justificatif`, `contract_template`, `signed_contract`) : Rôle fonctionnel du document.
- `status` (String, énumération: `pending`, `approved`, `archived`, `rejected`) : État de validation administrative.

### 5.5. Collection `events` (Schéma `Event`)
Modélise les manifestations, activités et initiatives locales.
- `createurId` (ObjectId, ref: `User`, requis) : Organisateur de l'événement.
- `titre` (String, requis) : Titre de l'événement.
- `description` (String, optionnel) : Description détaillée.
- `categorie` (String, requis) : Thématique (Fête de voisins, collecte, réunion, atelier).
- `date` (Date, requis) : Date et heure de l'événement.
- `lieu` (Objet, requis) : Adresse complète avec coordonnées géographiques (`latitude`, `longitude`).
- `capacite` (Number, requis) : Nombre maximal de participants autorisés.
- `statut` (String, énumération: `planifié`, `en_cours`, `terminé`, `annulé`) : État de l'événement.
- `conversationId` (ObjectId, ref: `Conversation`, optionnel) : Salon de chat dédié à l'événement.
- `interesses` (Array d'ObjectIds, ref: `User`) : Habitants ayant swipé positivement.
- `participants` (Array d'ObjectIds, ref: `User`) : Habitants inscrits.
- `participantsPresents` (Array d'ObjectIds, ref: `User`) : Habitants dont la présence physique a été confirmée.
- `payant` (Boolean, par défaut: `false`) : Indique si l'accès coûte des points.
- `pointsCout` (Number, optionnel) : Coût d'entrée en points.
- `pointsCreateur` (Number, par défaut: `0`) : Points gagnés par l'organisateur.
- `pointsParticipant` (Number, par défaut: `0`) : Points offerts pour encourager la participation citoyenne.
- `photoUrl` (String, optionnel) : Image d'illustration (Cloudinary).
- `templateDocumentId` (ObjectId, ref: `Document`, optionnel) : Charte ou contrat de décharge lié.

### 5.6. Collection `votes` (Schéma `Vote`)
Gère les référendums et décisions collectives au niveau du quartier.
- `zoneId` (ObjectId, ref: `Zone`, requis) : Quartier concerné.
- `creatorId` (ObjectId, ref: `User`, requis) : Initiateur du vote.
- `title` (String, requis) : Question soumise au vote.
- `description` (String, optionnel) : Détails ou contexte de la question.
- `options` (Array de Strings, requis) : Choix possibles (ex: `["Oui", "Non", "Blanc"]`).
- `expirationDate` (Date, requis) : Fin de validité du scrutin.
- `votedUsers` (Array) : Liste des votes exprimés stockant l'ID utilisateur anonymisé (si coché), l'option sélectionnée, et l'horodatage (`userId`, `option`, `votedAt`).
- `status` (String, énumération: `pending`, `active`, `rejected`, `closed`) : Statut de la consultation.
- `isAnonymous` (Boolean, par défaut: `true`) : Cache ou révèle l'identité des votants.
- `resultPosted` (Boolean, par défaut: `false`) : Indique si les résultats finaux ont été publiés à la vue du quartier.

### 5.7. Collection `incidents` (Schéma `Incident`)
Référence les anomalies matérielles ou de voirie signalées.
- `type` (String, requis) : Catégorie d'anomalie (Décharge sauvage, éclairage en panne, nid de poule...).
- `description` (String, requis) : Précisions écrites sur le signalement.
- `photoUrl` (String, optionnel) : Photo constatant les faits (Cloudinary).
- `statut` (String, énumération: `reported`, `assigned`, `resolved`, `dismissed`) : État du traitement.
- `priorite` (String, énumération: `low`, `normal`, `high`, `critical`) : Niveau d'urgence.
- `contexte` (String, énumération: `quartier`, `service`, `evenement`) : Indique d'où provient le signalement.
- `serviceId` / `eventId` (ObjectIds, ref: `Service` / `Event`, optionnels) : Liaisons éventuelles.
- `signaledPar` (String, optionnel) : Identifiant de l'habitant ayant lancé l'alerte.
- `zoneId` (ObjectId, ref: `Zone`, optionnel) : Quartier concerné.
- `assignedTo` (ObjectId, ref: `User`, optionnel) : Modérateur ou technicien affecté à la résolution.
- `resolutionComment` (String, optionnel) : Commentaire final de résolution de l'anomalie.

### 5.8. Collection `transactions` (Schéma `Transaction`)
Consigne l'historique complet et inaltérable des mouvements de points.
- `payerId` (ObjectId, ref: `User`, optionnel) : Débiteur (émetteur des points, absent en cas de don de bienvenue).
- `recipientId` (ObjectId, ref: `User`, optionnel) : Créditeur (récepteur des points).
- `amount` (Number, requis) : Quantité de points transférés.
- `serviceId` / `eventId` (ObjectIds, optionnels) : Prestation à l'origine du virement.
- `description` (String, requis) : Libellé du mouvement (ex: "Bienvenue sur Hoodly !").
- `type` (String, énumération: `service_payment`, `welcome_grant`, `admin_adjustment`, `event_payment`, `event_reward`) : Motif du flux comptable.

### 5.9. Collection `moderatorapplications` (Schéma `ModeratorApplication`)
Stocke les demandes formulées par les résidents pour obtenir le statut de modérateur.
- `userId` (ObjectId, ref: `User`, requis) : Candidat.
- `motivation` (String, requis) : Lettre ou arguments de motivation rédigés.
- `status` (String, énumération: `pending`, `approved`, `rejected`) : État de la demande.

### 5.10. Collection `zones` (Schéma `Zone`)
Délimite les quartiers géographiques dessinés par les administrateurs.
- `nom` (String, requis) : Nom du quartier.
- `ville` (String, requis) : Ville d'appartenance.
- `polygone` (Objet GeoJSON, requis) : Polygone définissant les limites géospatiales `{ type: String, coordinates: Number[][][] }`. Indexé géographiquement en 2D (`2dsphere`).
- `createdPar` (ObjectId, ref: `User`, optionnel) : Administrateur ayant tracé le quartier.
- `statut` (String, énumération: `active`, `inactive`) : État d'ouverture du quartier.
- `membresCount` (Number, par défaut: `0`) : Compteur dénormalisé pour suivre le nombre d'habitants.

### 5.11. Collection `zonememberships` (Schéma `ZoneMembership`)
Gère les liaisons d'habitation et la vérification des pièces justificatives.
- `userId` (ObjectId, ref: `User`, requis) : Habitant.
- `zoneId` (ObjectId, ref: `Zone`, requis) : Quartier.
- `justificatifUrl` / `pieceIdentiteUrl` (Strings) : Liens Cloudinary vers les justificatifs fournis lors de l'inscription.
- `statut` (String, énumération: `pending`, `approved`, `rejected`) : État de la demande d'intégration à la zone.
- `commentaireAdmin` (String, optionnel) : Explication du modérateur en cas de refus.
- `traitePar` (ObjectId, ref: `User`) : Modérateur ayant évalué le dossier.
- `traiteLe` (Date, optionnel) : Date de traitement du dossier.

### 5.12. Collection `zonerequests` (Schéma `ZoneRequest`)
Permet à des habitants de proposer la création d'un nouveau quartier non encore existant.
- `userId` (ObjectId, ref: `User`, requis) : Citoyen demandeur.
- `nomQuartier` / `ville` / `codePostal` (Strings, requis) : Informations géographiques.
- `description` (String, requis) : Explications du besoin.
- `location` (Objet GeoJSON Point, requis) : Coordonnées GPS suggérées pour le centre du quartier.
- `statut` (String, énumération: `pending`, `approved`, `rejected`) : Décision administrative.
- `commentaireAdmin` (String, optionnel) : Motif.
- `traitePar` / `traiteLe` (ObjectIds, Dates) : Trame de suivi.

### 5.13. Collection `posts` (Schéma `Post`)
Gère les billets publiés sur le forum de quartier.
- `author` (ObjectId, ref: `User`, requis) : Créateur du post.
- `authorSnapshot` (Objet, requis) : Snapshot contenant le `nom` et l'adresse d'avatar de l'auteur au moment de la publication (optimisation pour éviter les jointures en lecture).
- `zone` (ObjectId, ref: `Zone`, requis) : Forum du quartier ciblé.
- `content` (String, requis, max: 1000 caractères) : Texte du message.
- `media` (Array de Strings) : URLs d'images éventuelles jointes au post (Cloudinary).
- `type` (String, énumération: `discussion`, `alerte`, `evenement`) : Type de publication.
- `likes` (Array d'ObjectIds, ref: `User`) : Habitants ayant réagi au post.
- `commentCount` (Number, par défaut: `0`) : Nombre de réponses.
- `isPinned` (Boolean, par défaut: `false`) : Post mis en avant.
- `deletedAt` (Date, optionnel) : Date de suppression logique (soft-delete).

### 5.14. Collection `comments` (Schéma `Comment`)
Stocke les réponses associées aux posts du forum.
- `post` (ObjectId, ref: `Post`, requis) : Post parent.
- `author` (ObjectId, ref: `User`, requis) : Auteur de la réponse.
- `authorSnapshot` (Objet) : Nom et avatar de l'auteur.
- `content` (String, requis, max: 1000 caractères) : Texte du commentaire.
- `deletedAt` (Date, optionnel) : Soft delete.

### 5.15. Collection `conversations` (Schéma `Conversation`)
Regroupe les salons de discussion entre habitants.
- `serviceId` (ObjectId, ref: `Service`, optionnel) : Liaison si la discussion est liée à une annonce de service.
- `eventId` (ObjectId, ref: `Event`, optionnel) : Liaison si c'est le salon de discussion d'un événement.
- `nom` (String, optionnel) : Nom de la discussion (pour les groupes).
- `participants` (Array d'ObjectIds, ref: `User`, requis) : Liste des membres du canal.
- `statut` (String: `active` ou `archived`) : État du fil.
- `prestationStatut` (String, énumération: `aucun`, `valide`, `en_cours`, `termine`, `refuse`) : Statut de la prestation liée.
- `realisationValidee` (Boolean, par défaut: `false`) : Statut de validation de la transaction.
- `creneau` (Objet, optionnel) : Créneau de rendez-vous convenu entre les participants (`date`, `debut`, `fin`, `statut`, `proposeurId`).

### 5.16. Collection `messages` (Schéma `Message`)
Contient les messages individuels rattachés à une conversation.
- `conversationId` (ObjectId, ref: `Conversation`, requis) : Salon d'appartenance.
- `senderId` (ObjectId, ref: `User`, optionnel) : Auteur du message (absent en cas de message système).
- `content` (String, requis) : Contenu textuel, ou URL multimédia (photo/audio).
- `system` (Boolean, par défaut: `false`) : Vrai s'il s'agit d'un message généré automatiquement (ex: "Le contrat a été signé").
- `edited` (Boolean, optionnel) : Trace si le message a été modifié.

---

## 6. Base de Données Graphe (Neo4j)

Complétant MongoDB, **Neo4j** gère les connexions et interactions pour le système de recommandations.

- **Nœuds** :
  - `User { id: String }` (l'identifiant MongoDB de l'habitant).
  - `Event { id: String, categorie: String }` (l'identifiant MongoDB de l'événement).
- **Relations** :
  - `(:User)-[:INTERESSE]->(:Event)` : Swipe vers la droite.
  - `(:User)-[:PARTICIPE]->(:Event)` : Inscription finalisée.

---

## 7. Base de Données Locale (Java Desktop) : SQLite/H2

L'application lourde d'administration intègre une base relationnelle locale (SQLite) pour permettre un fonctionnement **Offline-first**.
- **DAO Incident** : Stocke localement les anomalies avec leur statut de synchronisation :
  - `synced` : Conforme à la base principale MongoDB.
  - `pending_create` : Signalement hors-ligne en attente d'envoi.
  - `pending_update` : Changement de statut local en attente de mise à jour sur le serveur.

---

## 8. Implémentations Techniques Clés

### 8.1. Parseur de Requêtes Jison
Un compilateur syntaxique a été conçu en utilisant **Jison** pour traduire des requêtes textuelles de recherche de documents (type SQL) en objets de filtres MongoDB sécurisés.
- *Entrée* : `FIND WHERE status = "signed" AND type = "contract"`
- *Sortie AST* : `{ status: "signed", type: "contract" }`
Ce mécanisme filtre rigoureusement l'entrée utilisateur pour éliminer tout risque d'injection NoSQL.

### 8.2. Moteur de Recommandations Collaboratives
Basé sur Neo4j, il recommande les activités de quartier par affinité collective (filtrage collaboratif via Cypher) :
```cypher
MATCH (me:User {id: $userId})-[:INTERESSE|PARTICIPE]->(e:Event)<-[:INTERESSE|PARTICIPE]-(other:User)
MATCH (other)-[:INTERESSE|PARTICIPE]->(suggestion:Event)
WHERE NOT (me)-[:INTERESSE|PARTICIPE]->(suggestion)
  AND suggestion.id <> $userId
RETURN suggestion.id AS eventId, count(*) AS score
ORDER BY score DESC
LIMIT 10
```

### 8.3. Double Signature de Contrats PDF (`pdf-lib`)
Chaque transaction payante implique l'édition d'un accord en PDF. Le serveur fusionne dynamiquement les signatures manuscrites (image PNG) dessinées par le client et le prestataire aux coordonnées `x, y` et numéros de pages définis. Un code OTP à usage unique (MFA) est utilisé pour authentifier l'acte, et un hash SHA-256 du PDF est archivé pour attester l'intégrité du document.

### 8.4. Authentification SSO et MFA (Auth0)
La connexion est déléguée à Auth0 en utilisant le protocole OAuth2/OpenID Connect. Le backend NestJS vérifie les jetons JWT asymétriques RS256. L'activation de la MFA est imposée à tous les utilisateurs pour sécuriser les transferts de points et la signature des contrats.

### 8.5. Processus de Synchronisation et Gestion des Conflits (JavaFX)
Un daemon thread (`SyncService`) surveille la connexion réseau du client Java.
- Au retour d'internet, il synchronise les modifications locales (`pending_create`, `pending_update`).
- En cas de modification concurrente sur le serveur depuis le dernier sync, l'application JavaFX lance une boîte de dialogue interactive proposant à l'administrateur de conserver sa version locale (`KEEP_LOCAL`) ou de récupérer les données distantes (`KEEP_SERVER`).

---

## 9. Conteneurisation et Infrastructure

La configuration Docker encapsule les services de développement et de production à l'aide de fichiers `Dockerfile` optimisés (multi-stage builds) et orchestrés par `docker-compose.yml`.

---

## 10. Stratégie de Tests

- **Tests Unitaires (Jest)** : Validations isolées de la logique métier (calculs de points, vérification du parseur de requêtes Jison, intégrité des coordonnées géographiques des polygones de quartier).
