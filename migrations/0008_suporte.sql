-- Migration 0008: mensagens do formulário de suporte. Só adiciona.
-- Toda mensagem fica guardada (mesmo se o envio do e-mail falhar) e serve de base para o limite anti-spam.
CREATE TABLE suporte_mensagens (
  id             TEXT PRIMARY KEY,
  user_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  email_resposta TEXT NOT NULL,
  assunto        TEXT NOT NULL,
  mensagem       TEXT NOT NULL,
  ip_hash        TEXT NOT NULL,   -- SHA-256 do IP: limita envios sem guardar o IP
  enviado        INTEGER NOT NULL DEFAULT 0,
  criado_em      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_suporte_ip ON suporte_mensagens(ip_hash, criado_em);
CREATE INDEX idx_suporte_data ON suporte_mensagens(criado_em);
