import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';
import { auth } from './auth';
import { convites, matches } from './convites';
import type { AppEnv } from './env';
import { equipe } from './equipe';
import { jogadores } from './jogadores';
import { denuncias, moderacao } from './moderacao';
import { perfil } from './perfil';
import { CONFIRMACAO_EXCLUSAO, dadosAnonimizados, rotaPublica } from './rules';
import { encerrarSessao, exigirSessao } from './sessao';
import { entradaInvalida } from './util';

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

// RNF09 (LGPD): excluir a própria conta. Anonimiza (ver dadosAnonimizados) e encerra a sessão.
app.post(
  '/me/excluir',
  zValidator('json', z.object({ confirmacao: z.literal(CONFIRMACAO_EXCLUSAO) }), entradaInvalida),
  async (c) => {
    const id = c.var.usuario.id;
    const anon = dadosAnonimizados(id);
    const db = c.env.DB;
    await db.batch([
      db
        .prepare(
          `UPDATE users SET discord_id = ?, discord_username = ?, nome = ?, avatar = NULL, email = NULL,
                  papel = 'jogador', excluido_em = datetime('now')
            WHERE id = ?`,
        )
        .bind(anon.discordId, anon.discordUsername, anon.nome, id),
      db.prepare('DELETE FROM profiles WHERE user_id = ?').bind(id),
      db.prepare("DELETE FROM invites WHERE status = 'pendente' AND (de_user = ?1 OR para_user = ?1)").bind(id),
      db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    ]);
    await encerrarSessao(c);
    return c.body(null, 204);
  },
);

app.route('/perfil', perfil);
app.route('/jogadores', jogadores);
app.route('/convites', convites);
app.route('/matches', matches);
app.route('/equipe', equipe);
app.route('/denuncias', denuncias);
app.route('/moderacao', moderacao);

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
