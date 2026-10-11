-- Migration 0009: avaliações que contam para a reputação. Só adiciona.
-- Avaliações feitas por contas banidas deixam de contar (nota, distribuição, lista e busca).
-- É um filtro, não uma exclusão: se a conta for desbanida após revisão, as avaliações voltam a contar.
CREATE VIEW ratings_validas AS
  SELECT r.* FROM ratings r JOIN users u ON u.id = r.autor_id WHERE u.banido = 0;
