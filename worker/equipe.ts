// Equipe de moderação (RF12): só admin. Admins vêm de ADMIN_DISCORD_IDS; aqui se promove e remove moderadores.
// Toda mudança vai para moderacao_log.
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
import type { AppEnv } from './env';
import { listaAdmins, papelEfetivo, podeMudarModerador } from './rules';
import { entradaInvalida, naoEncontrado } from './util';

const LIMITE_HISTORICO = 50;

const somenteAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (c.var.usuario.papel !== 'admin') return c.json({ error: 'sem_permissao' }, 403);
  await next();
});

/** Escapa curingas do LIKE (% e _) para buscar o texto literal. */
function padraoLike(texto: string): string {
  return `%${texto.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

export const equipe = new Hono<AppEnv>();
equipe.use('*', somenteAdmin);

equipe.get('/', async (c) => {
  const db = c.env.DB;
  const idsAdmins = [...listaAdmins(c.env.ADMIN_DISCORD_IDS)];
  const [admins, moderadores, historico] = await Promise.all([
    db
      .prepare(
        `SELECT id, nome, discord_username, discord_id FROM users
          WHERE discord_id IN (SELECT value FROM json_each(?)) ORDER BY nome`,
      )
      .bind(JSON.stringify(idsAdmins))
      .all<{ id: string; nome: string; discord_username: string; discord_id: string }>(),
    db
      .prepare("SELECT id, nome, discord_username, banido FROM users WHERE papel = 'moderador' ORDER BY nome")
      .all<{ id: string; nome: string; discord_username: string; banido: number }>(),
    db
      .prepare(
        `SELECT l.id, l.acao, l.motivo, l.criado_em, a.nome AS autor_nome, t.nome AS alvo_nome
           FROM moderacao_log l
           LEFT JOIN users a ON a.id = l.autor_id
           LEFT JOIN users t ON t.id = l.alvo_id
          ORDER BY l.criado_em DESC
          LIMIT ?`,
      )
      .bind(LIMITE_HISTORICO)
      .all<{ id: string; acao: string; motivo: string | null; criado_em: string; autor_nome: string | null; alvo_nome: string | null }>(),
  ]);

  const entraram = new Set(admins.results.map((a) => a.discord_id));
  return c.json({
    admins: admins.results.map((a) => ({ id: a.id, nome: a.nome, discordUsername: a.discord_username })),
    // Configurados como admin, mas ainda sem login no TeamUp
    adminsSemConta: idsAdmins.filter((id) => !entraram.has(id)).length,
    moderadores: moderadores.results.map((m) => ({
      id: m.id,
      nome: m.nome,
      discordUsername: m.discord_username,
      banido: m.banido === 1,
    })),
    historico: historico.results.map((h) => ({
      id: h.id,
      acao: h.acao,
      motivo: h.motivo,
      data: h.criado_em,
      autor: h.autor_nome,
      alvo: h.alvo_nome,
    })),
  });
});

/** Busca jogadores para promover (nome ou usuário do Discord). */
equipe.get(
  '/candidatos',
  zValidator('query', z.object({ q: z.string().trim().min(2).max(32) }), entradaInvalida),
  async (c) => {
    const { q } = c.req.valid('query');
    const admins = listaAdmins(c.env.ADMIN_DISCORD_IDS);
    const { results } = await c.env.DB.prepare(
      `SELECT id, nome, discord_username, discord_id FROM users
        WHERE banido = 0 AND papel = 'jogador' AND id <> ?2
          AND (nome LIKE ?1 ESCAPE '\\' OR discord_username LIKE ?1 ESCAPE '\\')
        ORDER BY nome
        LIMIT 10`,
    )
      .bind(padraoLike(q), c.var.usuario.id)
      .all<{ id: string; nome: string; discord_username: string; discord_id: string }>();
    return c.json({
      candidatos: results
        .filter((u) => !admins.has(u.discord_id))
        .map((u) => ({ id: u.id, nome: u.nome, discordUsername: u.discord_username })),
    });
  },
);

interface LinhaAlvo {
  id: string;
  discord_id: string;
  papel: string;
  banido: number;
}

async function carregarAlvo(c: { env: Env }, id: string) {
  return c.env.DB.prepare('SELECT id, discord_id, papel, banido FROM users WHERE id = ?').bind(id).first<LinhaAlvo>();
}

const motivoSchema = z.object({ motivo: z.string().trim().max(280).optional() });

equipe.post(
  '/moderadores',
  zValidator('json', z.object({ userId: z.string().uuid() }).merge(motivoSchema), entradaInvalida),
  async (c) => {
    const { userId, motivo } = c.req.valid('json');
    const eu = c.var.usuario;
    const alvo = await carregarAlvo(c, userId);
    if (!alvo) return c.json({ error: 'not_found' }, 404);

    const erro = podeMudarModerador({
      ator: { id: eu.id, papel: eu.papel },
      alvo: {
        id: alvo.id,
        papel: papelEfetivo(alvo.discord_id, alvo.papel, listaAdmins(c.env.ADMIN_DISCORD_IDS)),
        banido: alvo.banido === 1,
      },
      acao: 'promover',
    });
    if (erro) return c.json({ error: erro }, erro === 'sem_permissao' ? 403 : 409);

    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE users SET papel = 'moderador' WHERE id = ? AND papel = 'jogador'").bind(alvo.id),
      c.env.DB.prepare(
        "INSERT INTO moderacao_log (id, autor_id, acao, alvo_id, motivo) VALUES (?, ?, 'promover_moderador', ?, ?)",
      ).bind(crypto.randomUUID(), eu.id, alvo.id, motivo || null),
    ]);
    return c.body(null, 204);
  },
);

equipe.post(
  '/moderadores/:id/remover',
  zValidator('param', z.object({ id: z.string().uuid() }), naoEncontrado),
  zValidator('json', motivoSchema, entradaInvalida),
  async (c) => {
    const { id } = c.req.valid('param');
    const { motivo } = c.req.valid('json');
    const eu = c.var.usuario;
    const alvo = await carregarAlvo(c, id);
    if (!alvo) return c.json({ error: 'not_found' }, 404);

    const erro = podeMudarModerador({
      ator: { id: eu.id, papel: eu.papel },
      alvo: {
        id: alvo.id,
        papel: papelEfetivo(alvo.discord_id, alvo.papel, listaAdmins(c.env.ADMIN_DISCORD_IDS)),
        banido: alvo.banido === 1,
      },
      acao: 'remover',
    });
    if (erro) return c.json({ error: erro }, erro === 'sem_permissao' ? 403 : 409);

    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE users SET papel = 'jogador' WHERE id = ? AND papel = 'moderador'").bind(alvo.id),
      c.env.DB.prepare(
        "INSERT INTO moderacao_log (id, autor_id, acao, alvo_id, motivo) VALUES (?, ?, 'remover_moderador', ?, ?)",
      ).bind(crypto.randomUUID(), eu.id, alvo.id, motivo || null),
    ]);
    return c.body(null, 204);
  },
);
