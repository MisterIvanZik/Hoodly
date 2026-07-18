-- 🏘️ Hoodly - Jeu d'essai COMPLET pour SQLite/H2 (App Desktop)
-- Fichier texte SQL d'importation de la base de données locale

-- 1. Nettoyage
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS auth_tokens;
DROP TABLE IF EXISTS settings;

-- 2. Création des tables locales
CREATE TABLE incidents (
    id            TEXT PRIMARY KEY,
    type          TEXT NOT NULL,
    description   TEXT NOT NULL,
    statut        TEXT NOT NULL DEFAULT 'signale',
    priorite      TEXT NOT NULL DEFAULT 'normale',
    signaled_par  TEXT,
    zone_id       TEXT,
    photo_url     TEXT,
    created_at    TEXT,
    updated_at    TEXT,
    synced_at     TEXT,
    sync_status   TEXT NOT NULL DEFAULT 'synced' CHECK(sync_status IN ('synced', 'pending_create', 'pending_update')),
    contexte      TEXT,
    service_id    TEXT,
    event_id      TEXT
);

CREATE TABLE auth_tokens (
    id            INTEGER PRIMARY KEY CHECK(id = 1),
    access_token  TEXT NOT NULL,
    saved_at      TEXT NOT NULL
);

CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 3. Insertion de données d'essais
-- Incident 1 : Déjà synchronisé avec le serveur
INSERT INTO incidents (id, type, description, statut, priorite, signaled_par, zone_id, photo_url, created_at, updated_at, synced_at, sync_status, contexte)
VALUES (
    'server_inc_1',
    'Éclairage public en panne',
    'Le lampadaire devant le numéro 12 de la rue des Lilas ne s''allume plus du tout.',
    'signale',
    'normale',
    'Clara Lisika',
    'zone_lilas_123',
    'https://res.cloudinary.com/hoodly/image/upload/v1/incidents/lampadaire.jpg',
    '2026-07-16T12:00:00Z',
    '2026-07-16T12:05:00Z',
    '2026-07-16T12:05:00Z',
    'synced',
    'quartier'
);

-- Incident 2 : Créé en mode hors-ligne, en attente de synchronisation (pending_create)
-- Note : L'ID temporaire est généré localement
INSERT INTO incidents (id, type, description, statut, priorite, signaled_par, zone_id, photo_url, created_at, updated_at, synced_at, sync_status, contexte)
VALUES (
    'local_temp_987',
    'Dépôt sauvage d''encombrants',
    'Un vieux canapé et des cartons ont été déposés sur le trottoir d''en face.',
    'signale',
    'normale',
    'Tom Georgin',
    'zone_lilas_123',
    NULL,
    '2026-07-18T10:00:00Z',
    '2026-07-18T10:00:00Z',
    NULL,
    'pending_create',
    'quartier'
);

-- Incident 3 : Incident serveur dont le statut a été modifié localement hors-ligne (pending_update)
INSERT INTO incidents (id, type, description, statut, priorite, signaled_par, zone_id, photo_url, created_at, updated_at, synced_at, sync_status, contexte)
VALUES (
    'server_inc_2',
    'Arbre couché sur la chaussée',
    'Une branche d''arbre encombre la piste cyclable.',
    'en_cours', -- Modifié localement (était 'signale' sur le serveur)
    'haute',
    'Ivan Zazic',
    'zone_lilas_123',
    NULL,
    '2026-07-17T08:00:00Z',
    '2026-07-18T11:15:00Z', -- Date de modification locale
    '2026-07-17T08:10:00Z', -- Dernière synchro connue
    'pending_update',
    'quartier'
);

-- Paramètres de configuration locale
INSERT INTO settings (key, value) VALUES ('theme', 'sombre');
INSERT INTO settings (key, value) VALUES ('font_size', '14');
INSERT INTO settings (key, value) VALUES ('auto_sync_interval', '30');
