-- Migration 0010: evidências anexadas às denúncias (RF11). Só adiciona.
-- Imagens pequenas (até 1 MB, PNG/JPEG/WebP conferido pelo conteúdo) guardadas no próprio D1;
-- visíveis só para a equipe de moderação. Se a denúncia for apagada, as evidências vão junto.
CREATE TABLE evidencias (
  id          TEXT PRIMARY KEY,
  denuncia_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('image/png', 'image/jpeg', 'image/webp')),
  tamanho     INTEGER NOT NULL CHECK (tamanho > 0 AND tamanho <= 1048576),
  dados       BLOB NOT NULL,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_evidencias_denuncia ON evidencias(denuncia_id);
