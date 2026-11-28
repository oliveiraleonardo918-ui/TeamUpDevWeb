-- Migration 0011: jogadores salvos (RF15, RN10). Só adiciona.
-- Lista privada: só quem salvou vê. Banido ou conta excluída somem da lista pela consulta,
-- sem apagar o registro (se a conta for desbanida, volta a aparecer).
CREATE TABLE salvos (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salvo_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, salvo_id)
);