# TeamUp

Matchmaking de duos para Valorant. Frontend React + API Hono num único Cloudflare Worker, banco D1.

## Rodando local

```bash
npm ci
cp .dev.vars.example .dev.vars   # preencher credenciais do Discord
npm run db:migrate:local
npm run dev                       # http://localhost:5173
```

Scripts: `lint`, `typecheck`, `test`, `build`, `preview`, `cf-typegen` (rodar após mudar o `wrangler.jsonc`).
Deploy manual (normalmente quem faz é o pipeline): `npm run deploy:staging` e `npm run deploy:prod`.
Funciona igual no Windows (PowerShell), Linux e macOS.

## Pipeline

| Workflow | Quando | O que faz |
| --- | --- | --- |
| `ci.yml` | PR para `main` (e chamado pelo deploy) | lint + tipos + testes + build · Semgrep · Trivy (deps, segredos, Dockerfile, k8s) · imagem Docker no kind + ZAP baseline |
| `deploy.yml` | push na `main` | CI completo → staging (migrations, deploy, smoke) → aprovação → produção |
| `dependabot.yml` | semanal | npm, GitHub Actions (SHAs fixados) e imagem base |

A imagem Docker e o cluster kind existem **só para o DAST**: produção roda no Workers.

### Rodar o DAST na sua máquina

```bash
docker build -t teamup:ci .
kind create cluster --name teamup
kind load docker-image teamup:ci --name teamup
kubectl apply -f k8s/teamup.yaml
kubectl -n teamup port-forward svc/teamup 8787:80 &
mkdir -p zap-wrk && cp .zap/rules.tsv zap-wrk/ && chmod 777 zap-wrk
docker run --rm --network host -v "$PWD/zap-wrk:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://127.0.0.1:8787 -c rules.tsv -r zap-report.html -I
```

## Configuração única (uma pessoa do time faz)

1. **Cloudflare:** criar os bancos e colar os IDs no `wrangler.jsonc`:
   `npx wrangler d1 create teamup-staging` e `npx wrangler d1 create teamup-production`.
   Produção sai em `teamup.<subdominio>.workers.dev`; para usar domínio próprio, veja o comentário no `wrangler.jsonc`.
2. **API token** (Cloudflare → My Profile → API Tokens) com: Workers Scripts:Edit, D1:Edit
   e, para o domínio de produção, Workers Routes:Edit na zona.
3. **GitHub → Settings → Environments:** criar `staging` e `production`, cada um com os secrets
   `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` e a variável `APP_URL`.
   Em `production`, marcar **Required reviewers**.
4. **Secrets do app:** `npx wrangler secret put DISCORD_CLIENT_SECRET --env staging` (e `--env production`).
5. **Discord Developer Portal:** cadastrar os redirects de `localhost`, staging e produção.
6. **Branch protection na `main`:** exigir PR, 1 aprovação e os checks do `CI`.
   Para auto-merge, use o botão nativo "Enable auto-merge" do PR: merges feitos com o
   `GITHUB_TOKEN` (como no bot do CloudQuiz) **não disparam** o workflow de deploy.

## WAF (plano Free)

Precisa de um domínio próprio na Cloudflare: o WAF age na zona, não no `*.workers.dev`.
Quando tiverem domínio, produção passa a usar `custom_domain` com `workers_dev: false` (instruções no `wrangler.jsonc`).
Regras sugeridas estão no documento de requisitos.
