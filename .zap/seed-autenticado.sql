-- Dados do scan autenticado do ZAP (só no D1 local do cluster kind do CI; nunca em staging/produção).
-- __HASH__ é trocado pelo SHA-256 do token aleatório gerado a cada execução do CI.
-- Pré-requisito: seeds/local.sql (jogadores fictícios) aplicado antes.

-- Usuário do scan: moderador, para alcançar também as rotas de moderação
INSERT INTO users (id, discord_id, discord_username, nome, papel, maior_idade_em)
VALUES ('00000000-0000-4000-b000-00000000c1c1', '100000000000000001', 'zap', 'ZAP Scanner', 'moderador', datetime('now'));
INSERT INTO profiles (user_id, riot_id, elo, funcao_primaria, funcao_secundaria, turnos, estilo, bio)
VALUES ('00000000-0000-4000-b000-00000000c1c1', 'ZAPScanner#CI1', 'ouro', 'controlador', 'sentinela', '["noite"]', 'competitivo', 'Usuário do scan de segurança.');
INSERT INTO sessions (id, user_id, expira_em)
VALUES ('__HASH__', '00000000-0000-4000-b000-00000000c1c1', datetime('now', '+1 day'));

-- Um match com LunaVela (para /api/matches/:id) e um convite recebido de CaioNexo
INSERT INTO invites (id, de_user, para_user, status, criado_em, respondido_em)
VALUES ('00000000-0000-4000-b000-00000000c1c2', '00000000-0000-4000-b000-00000000c1c1', '00000000-0000-4000-8000-000000000001', 'aceito', datetime('now', '-1 hour'), datetime('now'));
INSERT INTO invites (id, de_user, para_user)
VALUES ('00000000-0000-4000-b000-00000000c1c5', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-b000-00000000c1c1');

-- Uma denúncia aberta com evidência (para /api/moderacao e /api/moderacao/evidencias/:id)
INSERT INTO reports (id, autor_id, denunciado_id, motivo, descricao)
VALUES ('00000000-0000-4000-b000-00000000c1c3', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000006', 'toxicidade', 'Denúncia de teste do scan.');
INSERT INTO evidencias (id, denuncia_id, tipo, tamanho, dados)
VALUES ('00000000-0000-4000-b000-00000000c1c4', '00000000-0000-4000-b000-00000000c1c3', 'image/png', 69, x'89504E470D0A1A0A0000000D4948445200000001000000010802000000907753DE0000000C49444154789C63F8CFC0000003010100C9FE92EF0000000049454E44AE426082');
