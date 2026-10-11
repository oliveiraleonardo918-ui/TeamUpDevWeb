-- Migration 0001: modelo de dados inicial do MVP (ver doc de requisitos)

CREATE TABLE users (
  id               TEXT PRIMARY KEY,
  discord_id       TEXT NOT NULL UNIQUE,
  discord_username TEXT NOT NULL,
  email            TEXT,
  nome             TEXT NOT NULL,
  is_admin         INTEGER NOT NULL DEFAULT 0,
  banido           INTEGER NOT NULL DEFAULT 0,
  criado_em        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expira_em TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE profiles (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  riot_id           TEXT,
  elo               TEXT,
  funcao_primaria   TEXT,
  funcao_secundaria TEXT,
  turnos            TEXT,          -- JSON: ["manha","tarde","noite"]
  estilo            TEXT CHECK (estilo IN ('casual', 'competitivo')),
  genero            TEXT,          -- opcional (RN05)
  bio               TEXT
);

CREATE TABLE invites (
  id        TEXT PRIMARY KEY,
  de_user   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  para_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status    TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'recusado')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (de_user <> para_user)
);
CREATE INDEX idx_invites_para ON invites(para_user, status);

CREATE TABLE ratings (
  id          TEXT PRIMARY KEY,
  invite_id   TEXT NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
  autor_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avaliado_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nota        INTEGER NOT NULL CHECK (nota BETWEEN 0 AND 5),
  comentario  TEXT,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (invite_id, autor_id)    -- RN04: uma avaliação por match
);

CREATE TABLE reports (
  id            TEXT PRIMARY KEY,
  autor_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  denunciado_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  motivo        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'resolvida')),
  criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
);
