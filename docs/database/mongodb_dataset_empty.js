/**
 * 🏘️ Hoodly - Jeu d'essai VIDE pour MongoDB
 * Fichier texte d'importation compatible Mongo Shell (mongosh)
 * 
 * Comment importer/vider :
 * mongosh "mongodb://localhost:27017/hoodly" docs/database/mongodb_dataset_empty.js
 */

db = db.getSiblingDB("hoodly");

print("--- Nettoyage de la base de données Hoodly ---");

// Suppression et nettoyage de toutes les collections
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

print("--- Base de données réinitialisée à vide avec succès ---");
