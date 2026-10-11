-- Migration 0002: login com Discord (RF01) e declaração de maioridade (RN06).
-- Só adiciona colunas: compatível com a versão anterior do código.

-- Hash do avatar do Discord (a URL é montada para cdn.discordapp.com)
ALTER TABLE users ADD COLUMN avatar TEXT;

-- RN06: quando o usuário declarou ter 18 anos ou mais (primeiro acesso)
ALTER TABLE users ADD COLUMN maior_idade_em TEXT;

-- sessions.id passa a guardar o SHA-256 do token do cookie, nunca o token em si
CREATE INDEX idx_sessions_expira ON sessions(expira_em);
