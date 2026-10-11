-- Migration 0007: excluir conta (RNF09, LGPD). Só adiciona.
-- A exclusão anonimiza a linha de users em vez de apagá-la: ratings tem ON DELETE CASCADE,
-- e apagar o usuário apagaria as avaliações que ele deu a outras pessoas.
ALTER TABLE users ADD COLUMN excluido_em TEXT;
