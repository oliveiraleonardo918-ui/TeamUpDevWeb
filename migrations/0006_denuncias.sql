-- Migration 0006: denúncias (RF11) e resolução pela equipe (RF12). Só adiciona.
-- reports.motivo (0001) passa a guardar a categoria: toxicidade, assedio, afk, perfil_falso, outro.

ALTER TABLE reports ADD COLUMN descricao TEXT;
ALTER TABLE reports ADD COLUMN resolucao TEXT CHECK (resolucao IN ('arquivada', 'banido'));
ALTER TABLE reports ADD COLUMN resolvido_em TEXT;
ALTER TABLE reports ADD COLUMN resolvido_por TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_reports_status ON reports(status, criado_em);
-- Limite diário de denúncias por autor e denúncia repetida contra a mesma pessoa
CREATE INDEX idx_reports_autor ON reports(autor_id, denunciado_id, status);
