# TeamUp — Requisitos do MVP

Matchmaking de duos para **Valorant**. Persona: Marina, joga à noite, cansada da toxicidade da fila solo,
quer checar a reputação de alguém antes de jogar junto.

Jornada: login → perfil gamer → busca com filtros → convite mútuo → troca de contato (Riot ID + Discord) → avaliação.

**Fora do MVP:** chat em tempo real, bot do Discord, Riot API, lobbies 5v5, monetização, app mobile.

## Atores

- **Jogador**: usa o app.
- **Administrador** (`users.is_admin = 1`): modera denúncias.

## Requisitos funcionais

| ID | Requisito | Origem |
| --- | --- | --- |
| RF01 | Login e logout com conta do Discord (OAuth2) | Canais (BMC) |
| RF02 | Cadastro do perfil gamer em 4 etapas: Jogos e Contas (Riot ID), Nível (elo + funções), Horários, Estilo de Jogo | US02 |
| RF03 | Checklist de progresso; "Completar Perfil" leva à etapa pendente | US02, cenários 1 e 2 |
| RF04 | Informar função primária e secundária e gênero (opcional); o usuário do Discord vem do login | US01 |
| RF05 | Listar Player Cards com filtros de elo, função complementar, turno e gênero | US01 |
| RF06 | Ver perfil detalhado com nota média e comentários recebidos | Jornada, passos 2 e 3 |
| RF07 | Enviar convite de dupla | Jornada, passo 4 |
| RF08 | Ver, aceitar e recusar convites recebidos | Jornada, passo 4 |
| RF09 | Após o match, exibir Riot ID e Discord de ambos | Jornada, passo 5 |
| RF10 | Avaliar o parceiro de 1 a 5 estrelas, com comentário opcional | Ciclo de feedback |
| RF11 | Denunciar um jogador informando o motivo | Moderação |
| RF12 | Admin lista denúncias e bane jogadores | Moderação |

Se sobrar tempo: chat simples, bloquear usuário, ordenar por compatibilidade, mais jogos.

## Regras de negócio

| ID | Regra |
| --- | --- |
| RN01 | Perfil mínimo = jogo + Riot ID + 1 turno. Sem isso, a busca fica bloqueada (US02). |
| RN02 | Match só com aceite mútuo. Riot ID e Discord só aparecem para a dupla depois do match. |
| RN03 | O filtro "função complementar" não retorna quem tem a mesma função primária. |
| RN04 | Só avalia quem teve match; uma avaliação por match. |
| RN05 | Gênero é opcional; o filtro por gênero só mostra quem declarou e consentiu. |
| RN06 | Uso restrito a maiores de 18 anos, declarado no primeiro acesso. |
| RN07 | Jogador banido não aparece na busca e não consegue logar. |

Exibição: a nota pública aparece a partir de 3 avaliações; antes disso o card mostra "Novo jogador".

## User stories (BDD)

**US01 — Filtragem por função e nível.** Como jogador, quero filtrar perfis por elo compatível, gênero ou
função complementar, para não entrar em partidas com choque de rotas ou disparidade de nível.

**US02 — Cadastro do perfil gamer.** Checklist: "Jogos e Contas", "Nível", "Horários", "Estilo de Jogo".
CTAs: "Criar Perfil" / "Completar Perfil".

- Cenário 1: autenticado e sem preferências → clica "Criar Perfil" → abre o onboarding no passo 1.
- Cenário 2: perfil incompleto (ex.: tem jogo, falta horário) → clica "Completar Perfil" → vai direto para a etapa pendente.

## Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF01 | Web responsiva, mobile-first |
| RNF02 | HTTPS em tudo |
| RNF03 | Sessão em cookie HttpOnly + Secure, nunca em localStorage |
| RNF04 | Toda rota `/api` exige login (exceto health e auth); cada jogador só altera os próprios dados |
| RNF05 | SQL sempre parametrizado (`prepare().bind()`) |
| RNF06 | Segredos fora do repositório (`.dev.vars` local, `wrangler secret` em staging/produção) |
| RNF07 | Plano gratuito da Cloudflare: 100 mil req/dia e 10 ms de CPU por requisição |
| RNF08 | TypeScript strict, ESLint, Conventional Commits |
| RNF09 | Termos de uso e opção de excluir a conta (LGPD básica) |
| RNF10 | README e ARCHITECTURE.md atualizados |

## Modelo de dados (D1)

Ver `migrations/0001_init.sql`. Tabelas: `users`, `sessions`, `profiles`, `invites`, `ratings`, `reports`.

## Decisões do time

- Jogo do MVP: Valorant.
- Login com Discord (OAuth2, escopo `identify`).
- Avaliação de 1 a 5 estrelas entra no MVP (decidido em 11/10/2026, alinhado ao protótipo).
- Sem domínio próprio por enquanto: produção em `teamup.<subdominio>.workers.dev`, sem WAF.
- Admins definidos por configuração (`ADMIN_DISCORD_IDS`, muda só por PR); moderadores promovidos por admins na tela.
- Avaliações feitas por contas banidas não contam na reputação (filtro reversível: voltam se a conta for desbanida).
- Denúncias aceitam até 3 imagens de evidência (até 1 MB cada), visíveis só para a equipe.
- Suporte por formulário dentro do site, enviado por e-mail (Resend) para suporteteamup@gmail.com.
- Foto de perfil vem do Discord; clicar na foto abre o perfil público da pessoa.
