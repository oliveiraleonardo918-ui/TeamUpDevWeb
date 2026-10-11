# TeamUp — instruções para o Claude Code

App web de matchmaking de duos para Valorant (projeto acadêmico, UNIFOR).
**Requisitos, regras de negócio e decisões: `docs/requisitos.md`.** Cite os IDs (RFxx, RNxx) em commits e PRs.

## Stack

- Frontend: React 19 + Vite + TypeScript em `src/` (SPA).
- API: Hono em `worker/index.ts`, rotas sob `/api/*`, no mesmo Cloudflare Worker que serve o front.
- Banco: Cloudflare D1 (SQLite), migrations em `migrations/`.
- Testes: Vitest (`worker/**/*.test.ts`). Regras de negócio puras ficam em `worker/rules.ts`.
- Deploy: GitHub Actions (`.github/workflows/`). Ambientes no `wrangler.jsonc`: local, staging, production.

## Comandos

```
npm run dev               # app local (http://localhost:5173), Worker e D1 locais
npm run db:migrate:local  # aplica migrations no D1 local
npm run lint
npm run typecheck
npm test
npm run build
npm run cf-typegen        # depois de mudar wrangler.jsonc ou .dev.vars
```

Antes de dizer que uma tarefa terminou, rode `lint`, `typecheck`, `test` e `build`, e corrija o que falhar.

## Como trabalhar

- Uma tarefa = uma branch (`feature/...`, `fix/...`) = um PR pequeno. Commits no padrão Conventional Commits.
- Para tarefas maiores, apresente o plano antes de editar.
- Toda regra de negócio nova (RNxx) ganha função em `worker/rules.ts` com teste.
- Mudança de banco = **nova** migration (`npx wrangler d1 migrations create DB <nome>`). Nunca edite uma migration
  que já está na `main`. Migrations precisam ser compatíveis com a versão anterior do código (adicionar, não renomear/apagar).
- Não altere `.github/workflows/`, `.zap/`, `Dockerfile` ou `k8s/` sem pedido explícito, e nunca enfraqueça os gates
  de segurança (Semgrep, Trivy, ZAP) para fazer o CI passar.

## Segurança (obrigatório)

- SQL sempre com `c.env.DB.prepare(...).bind(...)`. Nunca concatenar/interpolar valores em SQL.
- Validar toda entrada da API no servidor (schema com Zod), inclusive tamanho máximo de strings.
- Toda rota `/api/*` exige sessão, exceto `/api/health` e `/api/auth/*`. Autorização por recurso:
  o usuário só altera o próprio perfil; convites e matches só são visíveis para os dois participantes.
- Sessão: ID aleatório (`crypto.getRandomValues`, 32 bytes), guardado em `sessions` com expiração,
  cookie `HttpOnly; Secure; SameSite=Lax; Path=/`. Nada de token em `localStorage`.
- OAuth do Discord: parâmetro `state` aleatório salvo em cookie e conferido no callback; escopo `identify`.
- RN02: Riot ID e usuário do Discord só saem da API para quem tem match aceito com aquele jogador.
- RN07: usuário banido não loga e não aparece na busca; checar isso no middleware de sessão.
- Segredos só em `.dev.vars` (local) e `wrangler secret put` (staging/produção). Nunca em código ou `wrangler.jsonc`.
- Erros da API retornam JSON genérico (`{ "error": "..." }`), sem stack trace.
- Limite de CPU de 10 ms por requisição (plano Free): nada de hash de senha ou processamento pesado por request.

## Frontend

- O protótipo do Figma é a referência visual (acesse pelo MCP do Figma quando disponível).
  Adapte ao código existente; não copie código gerado sem revisar.
- Componentes em `src/components/`, telas em `src/pages/`, chamadas de API em `src/lib/api.ts`.
- Tailwind para estilo; cores e espaçamentos como tokens no tema, não valores soltos.
- **CSP** (`public/_headers`): nada de fontes, scripts ou imagens de outros domínios
  (exceto avatares de `cdn.discordapp.com`). Fontes ficam no próprio projeto.
- Mobile-first, textos em português do Brasil, acessível (labels, foco visível, contraste AA).
- Não usar logos, personagens ou arte da Riot Games/Valorant.
