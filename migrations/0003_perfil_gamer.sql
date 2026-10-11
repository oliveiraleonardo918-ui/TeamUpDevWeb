-- Migration 0003: perfil gamer (RF02-RF04, RN05). Só adiciona colunas.

-- "Disponível agora" (etapa Horários)
ALTER TABLE profiles ADD COLUMN disponivel INTEGER NOT NULL DEFAULT 0;

-- RN05: consentimento para exibir o gênero e aparecer no filtro por gênero
ALTER TABLE profiles ADD COLUMN genero_visivel INTEGER NOT NULL DEFAULT 0;
