-- Migration 0005: papéis e registro de moderação (RF12). Só adiciona.
--
-- Admins NÃO ficam no banco: vêm da variável ADMIN_DISCORD_IDS do wrangler.jsonc
-- (mudança só por PR). Aqui fica apenas quem é moderador.
-- A coluna users.is_admin (0001) deixa de ser usada e fica por compatibilidade.

ALTER TABLE users ADD COLUMN papel TEXT NOT NULL DEFAULT 'jogador'
  CHECK (papel IN ('jogador', 'moderador'));

-- Toda ação da equipe fica registrada (quem, o quê, contra quem, quando e por quê)
CREATE TABLE moderacao_log (
  id          TEXT PRIMARY KEY,
  autor_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  acao        TEXT NOT NULL CHECK (acao IN (
                'promover_moderador', 'remover_moderador', 'banir', 'desbanir', 'arquivar_denuncia')),
  alvo_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  denuncia_id TEXT REFERENCES reports(id) ON DELETE SET NULL,
  motivo      TEXT,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_moderacao_log_data ON moderacao_log(criado_em);
