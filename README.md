# 🎮 TeamUp

[![Live Demo](https://img.shields.io/badge/Live%20Demo-teamup.teamup--app.workers.dev-brightgreen)](https://teamup.teamup-app.workers.dev)
[![Deploy](https://img.shields.io/badge/deployed%20on-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Hono](https://img.shields.io/badge/API-Hono%204-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![D1](https://img.shields.io/badge/Banco-Cloudflare%20D1-F38020)](https://developers.cloudflare.com/d1/)
[![CI](https://github.com/oliveiraleonardo918-ui/TeamUpDevWeb/actions/workflows/ci.yml/badge.svg)](https://github.com/oliveiraleonardo918-ui/TeamUpDevWeb/actions)
[![License](https://img.shields.io/badge/license-Academic-blue)](#-licença)

> Matchmaking de duos para Valorant com reputação real: encontre alguém com afinidade, confira as avaliações e jogue sem toxicidade.

🔗 **Acesse o site em produção:** [https://teamup.teamup-app.workers.dev](https://teamup.teamup-app.workers.dev)

---

## 📋 Sobre o Projeto

O **TeamUp** é uma aplicação web desenvolvida como projeto acadêmico na **UNIFOR**. Ele nasceu de uma dor comum na fila
solo de Valorant: cair com pessoas tóxicas ou com funções e níveis que não combinam. A persona que guiou o projeto é a
**Marina**, que joga à noite depois do trabalho e quer checar a reputação de alguém antes de jogar junto.

A jornada do usuário é: **login → perfil gamer → busca com filtros → convite mútuo → troca de contato → avaliação**.

O projeto aplica na prática:

- 🌐 **Serverless na borda**: frontend e API rodam no mesmo Cloudflare Worker, perto do usuário, sem servidor para manter
- 🗄️ **Banco gerenciado**: Cloudflare D1 (SQLite distribuído) com migrations versionadas
- 🔐 **Segurança desde o design**: OAuth com `state`, sessão em cookie HttpOnly, SQL parametrizado, validação no servidor
- 🚀 **DevSecOps**: cada PR passa por lint, tipos, testes, SAST, SCA, scan de segredos/IaC e DAST antes do merge;
  o deploy vai para staging automaticamente e para produção com aprovação manual

---

## ✨ Funcionalidades

### 🔐 Login com Discord (RF01)
- **OAuth 2.0** com escopo mínimo (`identify`) e parâmetro `state` contra login forjado
- Declaração obrigatória de **18 anos ou mais** no primeiro acesso (RN06)
- Sessão de 30 dias em **cookie HttpOnly**; no banco fica só o hash do token
- Conta banida não entra e vê a tela **Conta suspensa** (RN07)

### 🧑‍🚀 Perfil gamer em 4 etapas (RF02–RF04)
- **Jogos e Contas** (Riot ID), **Nível** (elo, função primária e secundária), **Horários** (turnos e "disponível agora")
  e **Estilo de Jogo** (casual/competitivo, bio e gênero opcional)
- **Área do Jogador** com checklist e progresso; "Completar Perfil" leva direto à etapa pendente
- **Foto de perfil do Discord** em todo o app (com iniciais quando não há foto)
- **Sua reputação** na Área do Jogador, com acesso ao seu perfil público e às avaliações que você recebeu
- A busca só é liberada com o **perfil mínimo**: Riot ID + 1 horário (RN01)

### 🔎 Buscar duo (RF05, RF06)
- **Player Cards** ordenados pelos mais compatíveis (turnos em comum, função complementar, elo próximo, mesmo estilo)
- Filtros de **faixa de elo**, **só funções complementares** (RN03), **turno**, **estilo** e **gênero** (só quem consentiu, RN05)
- Filtros guardados na URL; no celular, os filtros abrem num painel que sobe de baixo
- **Perfil público** com reputação, distribuição das notas e todas as avaliações recebidas
- **Clicar na foto** de qualquer pessoa abre o perfil dela

### 🤝 Convites e match (RF07–RF09)
- Convite pelo perfil; o outro jogador **aceita ou recusa** na caixa de convites
- **Match só com aceite mútuo**; Riot ID e Discord aparecem **apenas para os dois** (RN02)
- Tela **"Deu match!"** com botões de copiar e abrir o Discord; histórico em **Matches**
- Proteções: sem convite duplicado, espera de 7 dias para reconvidar quem recusou, até 20 convites pendentes

### ⭐ Avaliação (RF10)
- De **1 a 5 estrelas** com comentário opcional, **uma por match** (RN04)
- A nota pública aparece a partir de **3 avaliações**; antes disso, "Novo jogador"
- Avaliações **só com estrelas** também aparecem no perfil
- Avaliações feitas por **contas banidas deixam de contar** (e voltam se a conta for desbanida)
- Dá para **denunciar o parceiro direto da tela de avaliação**

### 🛡️ Moderação (RF11, RF12)
- Qualquer jogador **denuncia** pelo perfil ou pela avaliação (anônimo para o denunciado), com até **3 imagens de
  evidência** (PNG, JPG ou WebP, até 1 MB cada)
- **Moderadores** veem as denúncias com as evidências, arquivam ou **banem** com motivo; o banido perde o acesso na hora
- Aba **Usuários banidos** com motivo, quem baniu, quando, denúncias e evidências; **admins removem banimentos**
- **Admins** gerenciam a equipe; tudo fica num **histórico de moderação**

### 🔏 Privacidade (RNF09)
- **Termos de uso** e **Política de privacidade** públicos
- **Excluir minha conta**: dados pessoais apagados; avaliações dadas ficam anônimas

### ✉️ Suporte
- **Formulário dentro do site** (rodapé de todas as telas, Área do Jogador e Conta suspensa): a mensagem chega na
  caixa do suporte por e-mail, sem abrir Outlook ou Gmail, e a resposta vai direto para o e-mail da pessoa

---

## 📏 Regras de negócio

| ID | Regra | Onde está |
|----|-------|-----------|
| RN01 | Perfil mínimo (Riot ID + 1 turno) para buscar e convidar | `perfilCompleto` em `worker/rules.ts` |
| RN02 | Match só com aceite mútuo; contatos só para a dupla | `worker/convites.ts` (`/api/matches/:id`) |
| RN03 | "Função complementar" não traz a mesma função primária | `funcaoComplementar` + SQL da busca |
| RN04 | Só avalia quem teve match, uma vez por match | `podeAvaliar` + `UNIQUE(invite_id, autor_id)` |
| RN05 | Gênero opcional; filtro só mostra quem declarou e consentiu | `generoParaSalvar` + SQL da busca |
| RN06 | Uso restrito a maiores de 18 anos | `decidirLogin` |
| RN07 | Banido não loga e não aparece na busca | middleware de sessão + `podeBanir` |

Todas as regras são funções puras em [`worker/rules.ts`](worker/rules.ts), cobertas por testes em
[`worker/rules.test.ts`](worker/rules.test.ts).

---

## 🛠️ Stack Técnica

### Frontend
- **[React 19](https://react.dev)**: biblioteca de interface. Cada tela é um componente em `src/pages/`, e as peças
  reaproveitáveis (botão, cartão, modal, campos) ficam em `src/components/`.
- **[TypeScript 6](https://www.typescriptlang.org/)**: tipagem estática em modo `strict` no front e no Worker. Os tipos
  dos bindings da Cloudflare (`Env`) são gerados por `wrangler types`.
- **[Vite 8](https://vite.dev/)**: servidor de desenvolvimento com recarga instantânea e build de produção.
- **[Tailwind CSS 4](https://tailwindcss.com/)**: estilização utility-first. Cores, tipografia e raios extraídos do
  protótipo do Figma ficam como **tokens** no `@theme` de `src/index.css`.
- **[React Router 8](https://reactrouter.com/)**: navegação SPA (`/buscar`, `/jogadores/:id`, `/matches/:id`...).
- **[Fontsource Arimo](https://fontsource.org/fonts/arimo)**: a fonte do protótipo, empacotada no próprio build
  (só o subconjunto latino), porque a CSP não permite fontes de outros domínios.
- **Ícones [Lucide](https://lucide.dev/)**: exportados do Figma como SVG local em `src/assets/icons/`.

### Backend
- **[Cloudflare Workers](https://workers.cloudflare.com/)**: runtime serverless na borda. Um único Worker serve os
  arquivos estáticos do React e a API em `/api/*`.
- **[Hono 4](https://hono.dev/)**: framework web leve feito para Workers. Organiza as rotas, os middlewares
  (sessão, CSRF, headers de segurança) e o tratamento de erros.
- **[Zod 4](https://zod.dev/) + [@hono/zod-validator](https://github.com/honojs/middleware)**: validação de toda
  entrada da API no servidor (tipos, enums, tamanhos máximos).
- **[Cloudflare D1](https://developers.cloudflare.com/d1/)**: banco SQLite gerenciado. Acesso só com
  `prepare().bind()` (SQL parametrizado), sem ORM. As migrations ficam em `migrations/`.
- **[Discord OAuth2](https://discord.com/developers/docs/topics/oauth2)**: provedor de identidade. O TeamUp nunca
  guarda senha. A foto de perfil vem do CDN do Discord.
- **[Resend](https://resend.com/)**: envio dos e-mails do formulário de suporte por API HTTP (plano gratuito).

### Qualidade e testes
- **[Vitest 5](https://vitest.dev/)**: testes unitários das regras de negócio (99 testes).
- **[ESLint 10](https://eslint.org/) + typescript-eslint + react-hooks**: análise estática de código.

### Infraestrutura e DevSecOps
- **[Wrangler 4](https://developers.cloudflare.com/workers/wrangler/)**: CLI da Cloudflare para deploy, migrations,
  secrets e geração de tipos.
- **[@cloudflare/vite-plugin](https://developers.cloudflare.com/workers/vite-plugin/)**: roda o Worker no `workerd`
  (o mesmo runtime de produção) durante o `npm run dev`.
- **[GitHub Actions](https://github.com/features/actions)**: pipeline de CI/CD com ambientes `staging` e
  `production` (com aprovação manual).
- **[Semgrep](https://semgrep.dev/)** (SAST), **[Trivy](https://trivy.dev/)** (dependências, segredos e IaC) e
  **[OWASP ZAP](https://www.zaproxy.org/)** (DAST) como gates de segurança.
- **[Docker](https://www.docker.com/) + [kind](https://kind.sigs.k8s.io/)**: o app roda num Kubernetes efêmero
  dentro do CI só para o ZAP atacar uma instância real.
- **[Dependabot](https://docs.github.com/code-security/dependabot)**: atualizações semanais de npm, Actions e imagem base.

Detalhes do pipeline em [DEVSECOPS.md](./DEVSECOPS.md) e da arquitetura em [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🚀 Como rodar localmente

### Pré-requisitos
- **Node.js 22+** e **Git** (no Windows: `winget install OpenJS.NodeJS.LTS` e `winget install Git.Git`)
- No Windows, uma vez: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (senão o PowerShell bloqueia o npm)
- Uma aplicação no [Discord Developer Portal](https://discord.com/developers/applications) com o redirect
  `http://localhost:5173/api/auth/callback`

### 1. Clonar o repositório

```bash
git clone https://github.com/oliveiraleonardo918-ui/TeamUpDevWeb.git
cd TeamUpDevWeb
```

### 2. Instalar dependências

```bash
npm ci
```

### 3. Configurar o segredo do Discord

```bash
cp .dev.vars.example .dev.vars
```

Edite `.dev.vars` e preencha `DISCORD_CLIENT_SECRET`. O `DISCORD_CLIENT_ID` é público e já está no `wrangler.jsonc`.
Opcional: `RESEND_API_KEY` para o formulário de suporte enviar e-mail (sem ela, a mensagem só fica guardada no D1).

### 4. Criar o banco local

```bash
npm run db:migrate:local   # aplica as migrations no D1 local
npm run db:seed:local      # opcional: 9 jogadores fictícios para testar a busca
```

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173). Para conferir a API: [http://localhost:5173/api/health](http://localhost:5173/api/health).

### Scripts

| Script | O que faz |
|--------|-----------|
| `npm run dev` | App local com Worker e D1 locais |
| `npm run lint` / `typecheck` / `test` / `build` | Verificações que o CI também roda |
| `npm run db:migrate:local` | Aplica migrations no D1 local |
| `npm run db:seed:local` | Insere jogadores fictícios (só local) |
| `npm run cf-typegen` | Regenera os tipos depois de mudar `wrangler.jsonc` ou `.dev.vars` |
| `npm run deploy:staging` / `deploy:prod` | Deploy manual (normalmente quem faz é o pipeline) |

---

## 📁 Estrutura do projeto

```
TeamUpDevWeb/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           # Qualidade, SAST, SCA/segredos/IaC e DAST
│   │   └── deploy.yml       # CI → staging → aprovação → produção
│   └── dependabot.yml
├── .zap/rules.tsv           # Regras do ZAP (FAIL / WARN / IGNORE)
├── docs/requisitos.md       # Requisitos, regras de negócio e decisões do time
├── k8s/teamup.yaml          # Deploy efêmero no kind (só para o DAST)
├── migrations/              # 0001 a 0010, só adicionam (compatíveis com a versão anterior)
├── seeds/local.sql          # Dados fictícios para o ambiente local
├── public/_headers          # CSP e headers de segurança dos estáticos
├── src/                     # Frontend React
│   ├── assets/icons/        # SVGs exportados do Figma
│   ├── components/          # Botao, Cartao, Modal, Opcoes, Navegacao...
│   ├── lib/                 # Cliente da API, hooks e tipos por domínio
│   ├── pages/               # Uma tela por arquivo
│   ├── App.tsx              # Rotas
│   └── index.css            # Tailwind + tokens do design
├── worker/                  # API (Hono)
│   ├── index.ts             # App, middlewares e montagem das rotas
│   ├── auth.ts              # Login com Discord
│   ├── sessao.ts            # Sessão e papel do usuário
│   ├── perfil.ts            # Perfil gamer
│   ├── jogadores.ts         # Busca e perfil público
│   ├── convites.ts          # Convites, matches e avaliações
│   ├── moderacao.ts         # Denúncias, evidências e banimento
│   ├── equipe.ts            # Gestão de moderadores
│   ├── suporte.ts           # Formulário de suporte (Resend)
│   ├── util.ts              # Helpers compartilhados (validação, foto do Discord)
│   ├── rules.ts             # Regras de negócio puras
│   └── rules.test.ts        # Testes das regras
├── Dockerfile               # Imagem só para o DAST
├── wrangler.jsonc           # Worker, D1 e ambientes
├── README.md                # Este arquivo
├── ARCHITECTURE.md          # Arquitetura técnica
└── DEVSECOPS.md             # Pipeline e segurança
```

---

## 📈 Fluxo de uso

1. O jogador confirma ter 18 anos ou mais e entra com o Discord
2. Preenche o perfil gamer em 4 etapas (Riot ID e 1 horário já liberam a busca)
3. Busca duos com filtros e confere a reputação no perfil público
4. Envia um convite; a outra pessoa aceita ou recusa
5. Com o aceite, os dois veem Riot ID e Discord e combinam a partida
6. Depois de jogar, cada um avalia o outro com 1 a 5 estrelas
7. Se alguém desrespeitar as regras, é denunciado e a moderação decide

---

## 🌍 Ambientes

| Ambiente | URL | Como atualiza |
|----------|-----|---------------|
| Local | `http://localhost:5173` | `npm run dev` |
| Staging | [teamup-staging.teamup-app.workers.dev](https://teamup-staging.teamup-app.workers.dev) | Automático a cada merge na `main` |
| Produção | [teamup.teamup-app.workers.dev](https://teamup.teamup-app.workers.dev) | Depois de aprovação manual no GitHub Actions |

Cada ambiente tem o próprio banco D1. Staging serve para testar antes de liberar para os jogadores.

---

## 🔒 Segurança

- ✅ Login só por OAuth do Discord, com `state` aleatório conferido no callback
- ✅ Sessão em cookie `HttpOnly; Secure; SameSite=Lax`; no D1 fica só o SHA-256 do token
- ✅ Toda rota da API exige sessão, exceto `/api/health` e `/api/auth/*`
- ✅ SQL sempre parametrizado (`prepare().bind()`), entrada validada com Zod no servidor
- ✅ Autorização por recurso: contatos só para a dupla do match, painel só para a equipe
- ✅ CSP restritiva, HSTS, `X-Frame-Options`, `nosniff` e proteção CSRF
- ✅ Banido perde todas as sessões na hora; ações da equipe registradas; avaliações dele deixam de contar
- ✅ Evidências: tipo conferido pelo conteúdo, limite de tamanho, visíveis só para a equipe
- ✅ Formulário de suporte com limite por IP, teto diário e campo-armadilha contra robôs
- ✅ Segredos fora do repositório (`.dev.vars` local, `wrangler secret` e GitHub Environments)
- ✅ Gates de SAST, SCA, segredos, IaC e DAST em todo PR

Detalhes em [DEVSECOPS.md](./DEVSECOPS.md).

---

## 🛡️ Administração e moderação

Três papéis: **jogador**, **moderador** (vê denúncias, arquiva e bane jogadores) e **admin** (tudo isso e ainda gerencia a equipe).

- **Admins** vêm só da configuração: `ADMIN_DISCORD_IDS` no `wrangler.jsonc` (IDs do Discord separados por vírgula,
  por ambiente). Ninguém vira admin pela tela, e admin não pode ser rebaixado nem banido pela interface.
- **Moderadores** são promovidos e removidos por um admin em **Moderação → Gerenciar equipe** (`/moderacao/equipe`).
- Toda ação da equipe vai para a tabela `moderacao_log`, visível no histórico da página Equipe.

### Adicionar (ou remover) um admin

1. A pessoa entra no TeamUp uma vez com o Discord.
2. Descubra o ID do Discord dela. Opção A: no Discord, ative *Configurações → Avançado → Modo desenvolvedor*,
   clique com o botão direito no perfil da pessoa → *Copiar ID do usuário*. Opção B (quem tem acesso à Cloudflare):
   `npx wrangler d1 execute DB --remote --env production --command "SELECT discord_id, discord_username FROM users WHERE discord_username = 'usuario'"`
3. Crie uma branch e edite `ADMIN_DISCORD_IDS` no `wrangler.jsonc` (`staging` e `production`; o topo é o ambiente local),
   acrescentando o ID com vírgula: `"ADMIN_DISCORD_IDS": "324755887363194893,111222333444555666"`.
4. Rode `npm run cf-typegen`, abra o PR e peça revisão de outro admin.
5. Com o merge, o staging é publicado; aprove o deploy de produção em Actions. O papel vale no próximo acesso da pessoa.

Para remover um admin, tire o ID da lista e siga os mesmos passos. Mantenha pelo menos um admin em cada ambiente.

### Adicionar um moderador

Um admin abre **Moderação → Gerenciar equipe**, busca a pessoa pelo nome ou usuário do Discord, clica em **Promover** e,
se quiser, informa o motivo (fica no histórico). Para tirar, **Remover** na lista de moderadores. Vale na hora.

---

## 🗺️ Roadmap

### ✅ Implementado
- [x] Login com Discord e declaração de maioridade
- [x] Perfil gamer em 4 etapas com checklist de progresso
- [x] Busca com filtros e ordenação por compatibilidade
- [x] Convites, match mútuo e troca de contatos protegida
- [x] Avaliações de 1 a 5 estrelas com reputação pública
- [x] Denúncias com evidências, moderação com papéis, aba de banidos e histórico auditável
- [x] Foto do Discord e avatar clicável para o perfil
- [x] Formulário de suporte dentro do site
- [x] Termos, política de privacidade e exclusão de conta (LGPD)
- [x] Interface responsiva e acessível, fiel ao protótipo do Figma
- [x] CI/CD com gates de segurança e aprovação para produção

### 🔮 Possíveis melhorias futuras
- [ ] Chat simples entre a dupla
- [ ] Bloquear usuário
- [ ] Mais jogos além de Valorant
- [ ] Notificações de convite (e-mail ou Discord)
- [ ] Evidências no R2 se o volume crescer
- [ ] Domínio próprio com WAF da Cloudflare na frente do Worker
- [ ] Testes de integração da API com o runtime do Workers

---

## 👥 Equipe

Projeto acadêmico desenvolvido na **UNIFOR** por:

| Membro |
|--------|
| **Rômulo Azevedo Montenegro Neto** |
| **João Gabriel de Holanda Montenegro** |
| **Lívia Maria Barreto Albuquerque** |
| **Leonardo Oliveira Freitas de Matos** |

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos. O TeamUp não é afiliado à Riot Games nem ao Discord.

---

<div align="center">

**Feito com 🎮 e respeito pela equipe TeamUp**

[🔗 Live Demo](https://teamup.teamup-app.workers.dev) · [📐 Architecture](./ARCHITECTURE.md) · [🛡️ DevSecOps](./DEVSECOPS.md)

</div>
