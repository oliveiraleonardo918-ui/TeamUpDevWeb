-- Migration 0004: convites e match (RF07-RF09). Só adiciona coluna e índices.

-- Quando o convite foi aceito ou recusado (data do match)
ALTER TABLE invites ADD COLUMN respondido_em TEXT;

-- Convites enviados por mim e busca de convite/match entre um par de jogadores
CREATE INDEX idx_invites_de ON invites(de_user, status);

-- No máximo um convite ativo (pendente ou aceito) por par, em qualquer direção.
-- Garante no banco o que a regra podeConvidar já confere (inclusive com cliques simultâneos).
CREATE UNIQUE INDEX idx_invites_par_ativo
  ON invites (min(de_user, para_user), max(de_user, para_user))
  WHERE status IN ('pendente', 'aceito');
