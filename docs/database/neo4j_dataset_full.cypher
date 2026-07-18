// 🏘️ Hoodly - Jeu d'essai COMPLET pour Neo4j (Cypher)
// À exécuter dans la console Neo4j (Neo4j Browser) ou via cypher-shell

// 1. Nettoyage du graphe existant
MATCH (n) DETACH DELETE n;

// 2. Création des nœuds Utilisateurs (IDs correspondants au jeu d'essai MongoDB)
CREATE (ivan:User {id: "auth0|ivan123"})
CREATE (clara:User {id: "auth0|clara456"})
CREATE (tom:User {id: "auth0|tom789"})

// Nouveaux voisins pour enrichir le graphe et tester la recommandation
CREATE (voisin1:User {id: "auth0|voisin1"})
CREATE (voisin2:User {id: "auth0|voisin2"})

// 3. Création des nœuds Événements (IDs correspondants)
CREATE (feteLilas:Event {id: "event_fete_lilas", categorie: "Fête de quartier"})
CREATE (bricoAtelier:Event {id: "event_brico", categorie: "Bricolage"})
CREATE (jardinPartage:Event {id: "event_jardin", categorie: "Jardinage"})
CREATE (coursInfo:Event {id: "event_info", categorie: "Informatique"})

// 4. Création des relations d'Intérêt et de Participation
// Clara et Tom aiment la fête des voisins
CREATE (clara)-[:PARTICIPE]->(feteLilas)
CREATE (tom)-[:INTERESSE]->(feteLilas)

// Le voisin 1 aime la fête des voisins et l'atelier bricolage
CREATE (voisin1)-[:PARTICIPE]->(feteLilas)
CREATE (voisin1)-[:INTERESSE]->(bricoAtelier)

// Le voisin 2 aime la fête des voisins, l'atelier bricolage et le jardinage
CREATE (voisin2)-[:PARTICIPE]->(feteLilas)
CREATE (voisin2)-[:PARTICIPE]->(bricoAtelier)
CREATE (voisin2)-[:INTERESSE]->(jardinPartage)

// Ivan aime l'informatique
CREATE (ivan)-[:PARTICIPE]->(coursInfo)

// Note : Si Clara (clara456) demande des recommandations :
// Elle est liée à feteLilas. Voisin 1 et Voisin 2 y sont aussi liés.
// Voisin 1 aime bricoAtelier. Voisin 2 aime bricoAtelier et jardinPartage.
// Le moteur recommandera en priorité bricoAtelier (score 2) puis jardinPartage (score 1).
