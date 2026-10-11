import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { auth } from './auth';
import { convites, matches } from './convites';
import type { AppEnv } from './env';
import { equipe } from './equipe';
import { jogadores } from './jogadores';
import { perfil } from './perfil';
import { rotaPublica } from './rules';
import { exigirSessao } from './sessao';

const app = new Hono<AppEnv>().basePath('/api');

// Headers de segurança em todas as respostas da API (CSP, nosniff, frame-options...)
app.use('*', secureHeaders());
// Recusa POST de formulário vindo de outra origem (o cookie SameSite=Lax já cobre o resto)
app.use('*', csrf());
// RNF04: toda rota exige sessão, exceto health e auth
app.use('*', (c, next) => (rotaPublica(c.req.path) ? next() : exigirSessao(c, next)));

// Health check: usado pelas probes do Kubernetes e pelo smoke test do deploy
app.get('/health', async (c) => {
  const row = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
  return c.json({ status: row?.ok === 1 ? 'ok' : 'degraded', env: c.env.APP_ENV });
});

app.route('/auth', auth);

// Dados do próprio usuário logado + selo de convites do menu (uma requisição por página)
app.get('/me', async (c) => {
  const u = c.var.usuario;
  const convites = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM invites i JOIN users d ON d.id = i.de_user
      WHERE i.para_user = ? AND i.status = 'pendente' AND d.banido = 0`,
  )
    .bind(u.id)
    .first<{ n: number }>();
  return c.json({
    id: u.id,
    nome: u.nome,
    discordUsername: u.discordUsername,
    avatarUrl: u.avatar ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=128` : null,
    papel: u.papel,
    convitesPendentes: convites?.n ?? 0,
  });
});

app.route('/perfil', perfil);
app.route('/jogadores', jogadores);
app.route('/convites', convites);
app.route('/matches', matches);
app.route('/equipe', equipe);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  // Erros esperados dos middlewares (ex.: CSRF recusado) mantêm o status, com corpo genérico
  if (err instanceof HTTPException && err.status < 500) {
    return c.json({ error: 'requisicao_recusada' }, err.status);
  }
  // Nunca devolver stack trace ao cliente
  console.error(err);
  return c.json({ error: 'internal_error' }, 500);
});

export default app;
