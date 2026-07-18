/**
 * 🏘️ Hoodly - Jeu d'essai COMPLET pour MongoDB
 * Fichier texte d'importation compatible Mongo Shell (mongosh)
 * 
 * Comment importer :
 * Via la console Compass ou en ligne de commande :
 * mongosh "mongodb://localhost:27017/hoodly" docs/database/mongodb_dataset_full.js
 */

// Initialisation de la base
db = db.getSiblingDB("hoodly");

// Nettoyage des collections existantes
db.zones.drop();
db.users.drop();
db.services.drop();
db.contracts.drop();
db.documents.drop();
db.events.drop();
db.votes.drop();
db.incidents.drop();
db.transactions.drop();
db.posts.drop();
db.comments.drop();
db.conversations.drop();
db.messages.drop();
db.zonememberships.drop();
db.zonerequests.drop();
db.moderatorapplications.drop();

print("--- Début de l'importation du jeu d'essai plein ---");

// 1. Insertion de la Zone (Quartier)
const zoneId = new ObjectId();
db.zones.insertOne({
  _id: zoneId,
  nom: "Quartier des Lilas",
  ville: "Paris",
  polygone: {
    type: "Polygon",
    coordinates: [[
      [2.35, 48.85],
      [2.36, 48.85],
      [2.36, 48.86],
      [2.35, 48.86],
      [2.35, 48.85]
    ]]
  },
  membresCount: 3,
  statut: "active",
  createdAt: new Date(),
  updatedAt: new Date()
});

// 2. Insertion des Utilisateurs
const ivanId = new ObjectId();
const claraId = new ObjectId();
const tomId = new ObjectId();

db.users.insertMany([
  {
    _id: ivanId,
    auth0Id: "auth0|ivan123",
    email: "ivan.zazic@hoodly.fr",
    firstName: "Ivan",
    lastName: "Zazic",
    role: "admin",
    points: 500,
    zoneId: zoneId,
    zoneStatut: "in_zone",
    interests: ["informatique", "bricolage", "tennis"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: claraId,
    auth0Id: "auth0|clara456",
    email: "clara.lisika@hoodly.fr",
    firstName: "Clara",
    lastName: "Lisika",
    role: "user",
    points: 150,
    zoneId: zoneId,
    zoneStatut: "in_zone",
    interests: ["jardinage", "musique", "cuisine"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: tomId,
    auth0Id: "auth0|tom789",
    email: "tom.georgin@hoodly.fr",
    firstName: "Tom",
    lastName: "Georgin",
    role: "moderator",
    points: 200,
    zoneId: zoneId,
    zoneStatut: "in_zone",
    interests: ["bricolage", "jeux_video", "cinema"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 3. Insertion des Documents (Templates & Justificatifs)
const docTemplateId = new ObjectId();
const docJustifId = new ObjectId();

db.documents.insertMany([
  {
    _id: docTemplateId,
    ownerId: ivanId,
    title: "Contrat Entraide Standard V1",
    fileUrl: "https://res.cloudinary.com/hoodly/raw/upload/v1/templates/contrat_standard.pdf",
    pdfHash: "8f5eb23b7e7a884a8d05b5ef21e90ef8347f8ba168b4d87b99c855bc7f4e9123",
    type: "contract_template",
    status: "approved",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: docJustifId,
    ownerId: claraId,
    title: "Justificatif Domicile Clara",
    fileUrl: "https://res.cloudinary.com/hoodly/image/upload/v1/justificatifs/justif_clara.pdf",
    pdfHash: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    type: "justificatif",
    status: "approved",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 4. Insertion des Services
const serviceId = new ObjectId();
db.services.insertOne({
  _id: serviceId,
  titre: "Aide pour tondre la pelouse",
  description: "J'aurais besoin d'aide pour tondre ma pelouse de 200m2. Matériel fourni.",
  type: "demande",
  categorie: "Jardinage",
  gratuit: false,
  points: 10,
  statut: "en_cours",
  createurId: claraId,
  zoneId: zoneId,
  responderId: tomId,
  realisationValidee: false,
  contractId: null, // Sera lié au contrat ci-dessous
  createdAt: new Date(),
  updatedAt: new Date()
});

// 5. Insertion du Contrat associé
const contractId = new ObjectId();
db.contracts.insertOne({
  _id: contractId,
  clientId: claraId,
  providerId: tomId,
  serviceId: serviceId,
  title: "Contrat de service - Tonte de pelouse",
  terms: "Le prestataire s'engage à effectuer la tonte de la pelouse. Le client s'engage à transférer 10 points.",
  pricePoints: 10,
  status: "signed",
  templateDocumentId: docTemplateId,
  pointsEscrowed: true,
  signatureZones: [
    { page: 1, x: 100, y: 150, width: 200, height: 80, assignee: "client" },
    { page: 1, x: 350, y: 150, width: 200, height: 80, assignee: "provider" }
  ],
  clientSignature: {
    signed: true,
    signedAt: new Date(),
    ipAddress: "192.168.1.15",
    signatureImage: "data:image/png;base64,iVBORw0KGgo...",
    hash: "client_signature_hash_sha256"
  },
  providerSignature: {
    signed: true,
    signedAt: new Date(),
    ipAddress: "192.168.1.20",
    signatureImage: "data:image/png;base64,iVBORw0KGgo...",
    hash: "provider_signature_hash_sha256"
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Mise à jour de la référence du contrat dans le service
db.services.updateOne({ _id: serviceId }, { $set: { contractId: contractId } });

// 6. Insertion des Transactions (Historique des points)
db.transactions.insertMany([
  {
    payerId: null,
    recipientId: ivanId,
    amount: 500,
    description: "Donation de bienvenue de l'administrateur",
    type: "welcome_grant",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    payerId: null,
    recipientId: claraId,
    amount: 150,
    description: "Donation de bienvenue standard",
    type: "welcome_grant",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    payerId: null,
    recipientId: tomId,
    amount: 200,
    description: "Donation de bienvenue standard",
    type: "welcome_grant",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 7. Insertion des Événements
const eventId = new ObjectId();
db.events.insertOne({
  _id: eventId,
  createurId: ivanId,
  titre: "Fête des voisins du quartier Lilas",
  description: "Retrouvons-nous autour d'un verre dans la cour de la mairie !",
  categorie: "Fête de quartier",
  date: new Date(new Date().getTime() + 86400000 * 5), // Dans 5 jours
  lieu: {
    adresse: "Place de la Mairie",
    ville: "Paris",
    codePostal: "75011",
    latitude: 48.855,
    longitude: 2.355
  },
  capacite: 50,
  statut: "planifié",
  participants: [claraId, tomId],
  interesses: [claraId, tomId],
  payant: false,
  pointsCreateur: 20,
  pointsParticipant: 5,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 8. Insertion des Votes / Sondages
db.votes.insertOne({
  zoneId: zoneId,
  creatorId: tomId,
  title: "Choix de la couleur des bacs à compost",
  description: "Veuillez choisir la couleur des nouveaux composteurs partagés.",
  options: ["Vert Foncé", "Marron Bois", "Noir Recyclé"],
  expirationDate: new Date(new Date().getTime() + 86400000 * 3), // Dans 3 jours
  votedUsers: [
    { userId: claraId, option: "Vert Foncé", votedAt: new Date() },
    { userId: ivanId, option: "Vert Foncé", votedAt: new Date() }
  ],
  status: "active",
  isAnonymous: true,
  resultPosted: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 9. Insertion des Incidents
db.incidents.insertOne({
  type: "Éclairage public en panne",
  description: "Le lampadaire devant le numéro 12 de la rue des Lilas ne s'allume plus du tout.",
  photoUrl: "https://res.cloudinary.com/hoodly/image/upload/v1/incidents/lampadaire.jpg",
  statut: "reported",
  priorite: "normal",
  contexte: "quartier",
  signaledPar: "Clara Lisika",
  zoneId: zoneId,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 10. Insertion sur le Forum (Posts & Commentaires)
const postId = new ObjectId();
db.posts.insertOne({
  _id: postId,
  author: claraId,
  authorSnapshot: {
    nom: "Clara Lisika",
    avatar: "https://res.cloudinary.com/hoodly/image/upload/v1/avatars/clara.png"
  },
  zone: zoneId,
  content: "Bonjour à tous, j'ai trouvé un chaton roux très affectueux dans le square. Si quelqu'un l'a perdu ?",
  media: ["https://res.cloudinary.com/hoodly/image/upload/v1/forum/chaton.jpg"],
  type: "discussion",
  likes: [tomId],
  commentCount: 1,
  isPinned: false,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.comments.insertOne({
  post: postId,
  author: tomId,
  authorSnapshot: {
    nom: "Tom Georgin",
    avatar: "https://res.cloudinary.com/hoodly/image/upload/v1/avatars/tom.png"
  },
  content: "Ah, il ressemble au chat de la boulangerie du coin. Je vais aller lui demander !",
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 11. Insertion des Conversations & Messages de Chat
const convId = new ObjectId();
db.conversations.insertOne({
  _id: convId,
  participants: [claraId, tomId],
  statut: "active",
  prestationStatut: "aucun",
  realisationValidee: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.messages.insertMany([
  {
    conversationId: convId,
    senderId: claraId,
    content: "Salut Tom, tu es disponible pour m'aider demain ?",
    system: false,
    createdAt: new Date(new Date().getTime() - 60000 * 10),
    updatedAt: new Date(new Date().getTime() - 60000 * 10)
  },
  {
    conversationId: convId,
    senderId: tomId,
    content: "Salut Clara ! Oui bien sûr, vers quelle heure ?",
    system: false,
    createdAt: new Date(new Date().getTime() - 60000 * 9),
    updatedAt: new Date(new Date().getTime() - 60000 * 9)
  }
]);

print("--- Fin de l'importation : 16 collections peuplées avec succès ---");
