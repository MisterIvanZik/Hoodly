-- 🏘️ Hoodly - Jeu d'essai VIDE pour SQLite/H2 (App Desktop)
-- Fichier texte SQL de création des tables locales (sans aucune donnée)

DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS auth_tokens;
DROP TABLE IF EXISTS settings;

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
