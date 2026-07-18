# 📝 Document de Synthèse - Réalisation du Projet Hoodly

Ce document dresse le bilan de la réalisation de la plateforme **Hoodly** (Connected Neighbours), détaillant la démarche projet, les contributions précises des membres de l'équipe, ainsi qu'une analyse critique et objective du travail accompli.

---

## 1. Démarche de Réalisation Suivie

Pour concevoir et réaliser Hoodly en respectant nos contraintes de temps et de qualité, nous avons adopté une démarche itérative et collaborative structurée autour de plusieurs outils professionnels.

### 1.1. Gestion des Tâches et Méthodologie Projet
- **Suivi des tickets** : Nous avons mis en place un **GitHub Project** faisant office de tableau Kanban pour lister, estimer et attribuer les tâches. Chaque fonctionnalité (services, votes, application desktop, messagerie...) a été découpée en tickets précis pour éviter tout chevauchement de travail.
- **Rythme de travail** : Notre développement a été rythmé par des sprints réguliers alternés avec des périodes de "rush" intensifs pour finaliser et stabiliser les livrables à l'approche des jalons clés.

### 1.2. Cycle de Développement et Git Flow
Nous avons mis en œuvre une gestion de version stricte sur **GitHub** :
- **Modèle de branches** : Chaque fonctionnalité a fait l'objet d'une branche dédiée. Aucun commit direct n'était autorisé sur la branche principale de développement (`develop`), à l'exception de corrections de bugs urgentes (*hotfixes*) requises en production.
- **Revue de code** : L'intégration d'une fonctionnalité passait obligatoirement par l'ouverture d'une Pull Request (PR) validée par les autres membres de l'équipe après relecture.

### 1.3. Collaboration Technique & Déploiement
- **Partage des secrets** : L'utilisation de **`dotenvx`** a été intégrée pour chiffrer nos fichiers de configuration locaux. Cela a permis de partager de manière professionnelle et sécurisée les jetons API d'Auth0, Cloudinary et Mapbox sans compromettre nos dépôts de code publics.
- **Environnement de Production** : Pour observer le comportement réel de nos applications, nous avons déployé l'architecture backend et web sur **Railway**. Cette plateforme nous a apporté une grande réactivité grâce à son tableau de bord unifié et sa gestion avancée des logs d'exécution.

---

## 2. Répartition Précise du Travail

Le développement de Hoodly a été réparti de manière équilibrée en fonction des compétences et des appétences de chacun.

### 2.1. Ivan Zazic (Lead Developer / Architecte & Designer)
Ivan a assuré le rôle d'architecte global du projet et a défini l'identité visuelle de la plateforme.
- **Initiation du Projet** : Mise en place de l'ossature générale (scaffolding) de l'API NestJS Backend et des deux applications Web React (Client et Admin).
- **Design et UI/UX** : Conception et intégration de la charte graphique globale de la plateforme, garantissant une expérience utilisateur moderne et fluide.
- **Authentification SSO** : Installation et intégration initiale d'**Auth0** pour le Single Sign-On (avec l'assistance de Clara sur le flow).
- **Développement du Portail Administrateur (Front-End Admin)** : Réalisation de la quasi-totalité de l'interface d'administration :
  - Tableau de bord de suivi d'activité.
  - Modération des candidatures de modérateurs et des utilisateurs.
  - Gestion et suivi des incidents signalés.
  - Intégration de **Mapbox** pour la visualisation, le dessin géographique des quartiers et la détection géospatiale de collisions/limites.
  - Approbation des résidents et affectation à leur quartier.
- **Fonctionnalités Front-End Client (Habitant)** :
  - Page de Profil complète.
  - Pages de Planning et de Configuration/Settings.
  - Page de Support technique et d'Aide.
  - Module de traduction multilingue dynamique (Français / Anglais).
  - Intégration du widget d'actualités "Fit with Twitter" sur le tableau de bord de l'habitant.
- **Maintenance & DevOps** : Déploiement de l'API et des frontends sur Railway, et résolution des bugs critiques en production (services, événements, messagerie, incidents).

### 2.2. Clara Louise Lisika (Full-Stack Developer Web)
Clara s'est concentrée sur la logique métier et l'implémentation des fonctionnalités clés d'entraide sur le Web.
- **Fonctionnalités Front-End Client (Habitant)** :
  - Module d'échange de **Services** (publication, recherche et consultation).
  - Système de **Messagerie instantanée** (conversations privées entre habitants et salons de discussion automatiquement générés lors de l'acceptation d'un service).
  - Page de gestion des **Contrats** liés aux prestations.
  - Module de **Votes et Sondages** pour la vie citoyenne locale.
  - Formulaire et carte interactive de déclaration d'**Incidents** pour les habitants.
- **Logique Backend & API** :
  - Co-développement des contrôleurs et des schémas de base de données MongoDB associés à ces fonctionnalités.
  - Implémentation du système de points (gestion de la balance utilisateur, débits, crédits et mise en séquestre des points durant l'exécution d'un contrat).
  - Soutien à la configuration du flow d'authentification Auth0 sur la partie frontend.

### 2.3. Tom Georgin (Desktop JavaFX Developer & Graph Engineer)
Tom s'est illustré sur la partie client lourd d'administration et les moteurs de recommandation de graphes.
- **Application Desktop JavaFX (Offline-First)** : Ivan ayant initialisé une structure minimale, Tom a pris la direction complète de cette application pour développer l'intégralité de ses fonctionnalités :
  - Interface utilisateur moderne en JavaFX.
  - Base de données locale SQLite et gestion de la persistance.
  - Mécanisme de synchronisation automatique bidirectionnelle (`SyncService`).
  - Système interactif de résolution de conflits (Keep Local vs. Server) en cas d'éditions concurrentes hors-ligne.
  - Moteur de thèmes CSS dynamiques et chargeur de plugins externes au format JAR.
  - Clara et Ivan ont apporté un soutien ponctuel en programmation par paire (*pair programming*) pour fixer quelques points d'intégration.
- **Développement Front-End Client (Habitant)** :
  - Module de gestion des **Événements** de quartier (création, calendrier, participation).
  - Intégration du mode interactif "Swipe" d'intérêt pour les événements de quartier.
- **Base de Données Graphe Neo4j** :
  - Conception du modèle de graphe social (nœuds `User`/`Event` et relations `INTERESSE`/`PARTICIPE`).
  - Écriture des requêtes de recommandation collaborative complexes en Cypher permettant d'alimenter le fil d'actualité personnalisé de l'habitant.

---

## 3. Analyse Critique et Objective du Projet

### 3.1. Les Points Forts (Réussites)
- **Expérience Utilisateur (UI/UX) Premium** : Le design moderne et intuitif de l'application (en particulier le portail habitant) constitue notre plus grande fierté technique. Les retours utilisateurs lors des démonstrations ont été extrêmement positifs, confirmant l'attractivité visuelle du projet.
- **Diversité et Robustesse des Technologies** : Intégrer de front du NestJS, du React, du JavaFX, de la géolocalisation Mapbox, et deux paradigmes de bases de données (MongoDB et Neo4j) de façon cohérente démontre la solidité technique de l'architecture.
- **Stabilité de la Production** : Le choix de Railway combiné à l'utilisation de `dotenvx` nous a offert un cadre d'exploitation professionnel, réduisant les risques d'exposition de clés privées et simplifiant le débogage en conditions réelles grâce aux logs centralisés.

### 3.2. Les Difficultés Rencontrées et Solutions Apportées
- **Ségrégation des Rôles (Client, Modérateur, Administrateur)** : La gestion de la navigation et des permissions entre les interfaces grand public et le back-office d'administration a été complexe à stabiliser. Nous y sommes parvenus en consolidant les Guards d'API côté NestJS et en structurant rigoureusement les rôles Auth0.
- **Conformité RGPD et Anonymisation** : L'exigence de suppression totale d'un compte (RGPD) a posé des difficultés en termes de cohérence des données. Lors de la suppression d'un habitant, il a fallu s'assurer :
  - De supprimer physiquement tous ses documents et avatars hébergés sur Cloudinary (pour ne pas laisser de traces orphelines).
  - D'anonymiser ses votes et messages passés pour ne pas rompre l'intégrité des fils de discussion.
  - De supprimer en cascade ses contrats non finalisés et ses réservations d'événements.
  *Solution* : Les logs de Railway nous ont aidés à identifier et corriger les bugs de cascade de suppression pour obtenir un processus fluide et sécurisé.
- **Synchronisation Offline-First** : La gestion des conflits d'édition sur l'application lourde JavaFX lorsque la connexion réseau est instable a représenté un défi algorithmique majeur. Il a été résolu par la mise en place de marqueurs temporels de synchronisation (`syncedAt`) comparés à chaque mise à jour.

### 3.3. Axes d'Amélioration / Perspectives de Développement
Bien que le projet réponde parfaitement aux exigences du cahier des charges, l'équipe a identifié plusieurs pistes d'évolution fonctionnelles et techniques pour enrichir la plateforme à l'avenir :

1. **Visualisation des Profils Tiers et Système de Réputation/Confiance** : Permettre aux résidents de consulter les profils publics de leurs voisins (biographie, compétences déclarées, historique d'entraide) avant d'accepter un service ou de se rendre à un événement. Cela s'accompagnerait de l'intégration d'un système de notation (étoiles, avis), de badges de compétences vérifiés (ex: "Expert Bricolage") et de niveaux/grades d'implication citoyenne pour renforcer la confiance mutuelle.
2. **Système de Parrainage et de Cooptation** : Mettre en œuvre un système de parrainage permettant aux habitants d'inviter des voisins n'ayant pas encore rejoint Hoodly via un lien d'invitation unique, en récompensant le parrain avec des points bonus d'entraide pour encourager l'adoption rapide de la plateforme.
3. **Appels Audio et Vidéo Intégrés** : Ajouter des fonctionnalités d'appels voix et vidéo en temps réel (via WebRTC) directement au sein de la messagerie instantanée, facilitant la coordination immédiate et directe lors de la planification de services complexes.
4. **Sécurisation de la Création de Compte (Double saisie du mot de passe)** : Imposer un champ de confirmation du mot de passe lors de l'onboarding. Cette mesure simple mais indispensable permet d'éviter les erreurs de frappe involontaires lors de l'inscription et d'assurer une meilleure sécurité dès la première connexion.
5. **Automatisation Événementielle via les Votes du Quartier** : Lier dynamiquement le module de scrutin avec la création d'activités. Si une proposition de vote communautaire (ex: l'organisation d'un atelier collectif ou d'une fête locale) obtient une majorité positive, le backend générerait automatiquement l'événement correspondant en pré-remplissant les détails (thème, date suggérée) validés par les habitants.
6. **Enrichissement du Graphe Social Neo4j** : Étendre l'exploitation du graphe relationnel. Au lieu de se limiter aux suggestions d'événements, le graphe modéliserait également les relations d'entraide réelles (qui a aidé qui, compétences partagées). L'algorithme de recommandation collaborative pourrait alors suggérer des profils de voisins de confiance particulièrement adaptés à des besoins spécifiques de services.
