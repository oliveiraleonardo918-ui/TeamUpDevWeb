// RF07 (enviar convite), RF08 (ver, aceitar e recusar) e RF09 (contatos após o match).
// RN02: match só com aceite mútuo; Riot ID e Discord só para os dois participantes.
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from './env';
import { DIAS_APOS_RECUSA, notaPublica, perfilCompleto, podeConvidar } from './rules';
import { conviteEntre, entradaInvalida, lerTurnos, naoEncontrado } from './util';

const LIMITE_LISTA = 50;

const idSchema = z.object({ id: z.string().uuid() });

interface LinhaConvite {
  id: string;
  status: 'pendente' | 'aceito' | 'recusado';
  criado_em: string;
  respondido_em: string | null;
  uid: string;
  nome: string;
  elo: string | null;
  funcao_primaria: string | null;
  funcao_secundaria: string | null;
  turnos: string | null;
  estilo: string | null;
  media: number | null;
  total: number;
}

function paraConvite(l: LinhaConvite) {
  return {
    id: l.id,
    status: l.status,
    data: l.criado_em,
    respondidoEm: l.respondido_em,
    jogador: {
      id: l.uid,
      nome: l.nome,
      elo: l.elo,
      funcaoPrimaria: l.funcao_primaria,
      funcaoSecundaria: l.funcao_secundaria,
      turnos: lerTurnos(l.turnos),
      estilo: l.estilo,
      nota: notaPublica(l.media, l.total),
      avaliacoes: l.total,
    },
  };
}

export const convites = new Hono<AppEnv>();

convites.get('/', async (c) => {
  const eu = c.var.usuario.id;
  const db = c.env.DB;
  const [recebidos, enviados] = await Promise.all([
    db
      .prepare(
        `SELECT i.id, i.status, i.criado_em, i.respondido_em, u.id AS uid, u.nome,
                p.elo, p.funcao_primaria, p.funcao_secundaria, p.turnos, p.estilo,
                r.media, COALESCE(r.total, 0) AS total
           FROM invites i
           JOIN users u ON u.id = i.de_user
           LEFT JOIN profiles p ON p.user_id = u.id
           LEFT JOIN (SELECT avaliado_id, AVG(nota) AS media, COUNT(*) AS total
                        FROM ratings GROUP BY avaliado_id) r ON r.avaliado_id = u.id
          WHERE i.para_user = ? AND i.status = 'pendente' AND u.banido = 0
          ORDER BY i.criado_em DESC
          LIMIT ?`,
      )
      .bind(eu, LIMITE_LISTA)
      .all<LinhaConvite>(),
    db
      .prepare(
        `SELECT i.id, i.status, i.criado_em, i.respondido_em, u.id AS uid, u.nome,
                p.elo, p.funcao_primaria, p.funcao_secundaria, p.turnos, p.estilo,
                r.media, COALESCE(r.total, 0) AS total
           FROM invites i
           JOIN users u ON u.id = i.para_user
           LEFT JOIN profiles p ON p.user_id = u.id
           LEFT JOIN (SELECT avaliado_id, AVG(nota) AS media, COUNT(*) AS total
                        FROM ratings GROUP BY avaliado_id) r ON r.avaliado_id = u.id
          WHERE i.de_user = ? AND u.banido = 0
          ORDER BY i.criado_em DESC
          LIMIT ?`,
      )
      .bind(eu, LIMITE_LISTA)
      .all<LinhaConvite>(),
  ]);
  return c.json({ recebidos: recebidos.results.map(paraConvite), enviados: enviados.results.map(paraConvite) });
});

/** Contagem para o selo do menu ("Convites ❷"). */
convites.get('/contagem', async (c) => {
  const linha = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM invites i JOIN users u ON u.id = i.de_user
      WHERE i.para_user = ? AND i.status = 'pendente' AND u.banido = 0`,
  )
    .bind(c.var.usuario.id)
    .first<{ n: number }>();
  return c.json({ pendentes: linha?.n ?? 0 });
});

convites.post('/', zValidator('json', z.object({ para: z.string().uuid() }), entradaInvalida), async (c) => {
  const eu = c.var.usuario.id;
  const { para } = c.req.valid('json');
  const db = c.env.DB;

  const [alvo, meu, pendentes, recusa] = await Promise.all([
    db
      .prepare(
        `SELECT u.id FROM users u JOIN profiles p ON p.user_id = u.id
          WHERE u.id = ? AND u.banido = 0 AND p.riot_id IS NOT NULL AND p.riot_id <> ''`,
      )
      .bind(para)
      .first<{ id: string }>(),
    db.prepare('SELECT riot_id, turnos FROM profiles WHERE user_id = ?').bind(eu).first<{ riot_id: string | null; turnos: string | null }>(),
    db
      .prepare("SELECT COUNT(*) AS n FROM invites WHERE de_user = ? AND status = 'pendente'")
      .bind(eu)
      .first<{ n: number }>(),
    db
      .prepare(
        `SELECT 1 AS sim FROM invites
          WHERE de_user = ? AND para_user = ? AND status = 'recusado'
            AND respondido_em > datetime('now', ?)`,
      )
      .bind(eu, para, `-${DIAS_APOS_RECUSA} days`)
      .first<{ sim: number }>(),
  ]);
  if (!alvo) return c.json({ error: 'not_found' }, 404);

  const entrePar = await conviteEntre(c, eu, para);
  const motivo = podeConvidar({
    euId: eu,
    alvoId: para,
    meuPerfilCompleto: perfilCompleto({ riotId: meu?.riot_id, turnos: lerTurnos(meu?.turnos ?? null) }),
    entrePar,
    pendentesEnviados: pendentes?.n ?? 0,
    recusouRecentemente: recusa !== null,
  });
  if (motivo) {
    const status = motivo === 'perfil_incompleto' ? 403 : motivo === 'proprio_usuario' ? 400 : 409;
    return c.json({ error: motivo, conviteId: entrePar?.id ?? null }, status);
  }

  const id = crypto.randomUUID();
  try {
    await db.prepare('INSERT INTO invites (id, de_user, para_user) VALUES (?, ?, ?)').bind(id, eu, para).run();
  } catch {
    // Índice único do par: outro convite foi criado ao mesmo tempo
    return c.json({ error: 'convite_existente', conviteId: null }, 409);
  }
  return c.json({ id }, 201);
});

// Só quem recebeu responde, e só convite pendente de alguém não banido (UPDATE condicional = atômico)

convites.post('/:id/aceitar', zValidator('param', idSchema, naoEncontrado), async (c) => {
  const { id } = c.req.valid('param');
  const r = await c.env.DB.prepare(
    `UPDATE invites SET status = 'aceito', respondido_em = datetime('now')
      WHERE id = ? AND para_user = ? AND status = 'pendente'
        AND de_user IN (SELECT id FROM users WHERE banido = 0)`,
  )
    .bind(id, c.var.usuario.id)
    .run();
  if (r.meta.changes === 0) return c.json({ error: 'convite_indisponivel' }, 404);
  return c.json({ matchId: id });
});

convites.post('/:id/recusar', zValidator('param', idSchema, naoEncontrado), async (c) => {
  const { id } = c.req.valid('param');
  const r = await c.env.DB.prepare(
    `UPDATE invites SET status = 'recusado', respondido_em = datetime('now')
      WHERE id = ? AND para_user = ? AND status = 'pendente'`,
  )
    .bind(id, c.var.usuario.id)
    .run();
  if (r.meta.changes === 0) return c.json({ error: 'convite_indisponivel' }, 404);
  return c.body(null, 204);
});

export const matches = new Hono<AppEnv>();

matches.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT i.id, COALESCE(i.respondido_em, i.criado_em) AS data,
            u.id AS uid, u.nome, p.elo, p.funcao_primaria
       FROM invites i
       JOIN users u ON u.id = CASE WHEN i.de_user = ?1 THEN i.para_user ELSE i.de_user END
       LEFT JOIN profiles p ON p.user_id = u.id
      WHERE i.status = 'aceito' AND (i.de_user = ?1 OR i.para_user = ?1) AND u.banido = 0
      ORDER BY data DESC
      LIMIT 100`,
  )
    .bind(c.var.usuario.id)
    .all<{ id: string; data: string; uid: string; nome: string; elo: string | null; funcao_primaria: string | null }>();

  return c.json({
    matches: results.map((m) => ({
      id: m.id,
      data: m.data,
      jogador: { id: m.uid, nome: m.nome, elo: m.elo, funcaoPrimaria: m.funcao_primaria },
    })),
  });
});

/** RF09: contatos do parceiro. Só os dois participantes enxergam (senão 404, sem revelar que existe). */
matches.get('/:id', zValidator('param', idSchema, naoEncontrado), async (c) => {
  const eu = c.var.usuario;
  const { id } = c.req.valid('param');
  const linha = await c.env.DB.prepare(
    `SELECT i.id, COALESCE(i.respondido_em, i.criado_em) AS data,
            u.id AS uid, u.nome, u.discord_username, u.discord_id, p.riot_id
       FROM invites i
       JOIN users u ON u.id = CASE WHEN i.de_user = ?2 THEN i.para_user ELSE i.de_user END
       LEFT JOIN profiles p ON p.user_id = u.id
      WHERE i.id = ?1 AND i.status = 'aceito' AND (i.de_user = ?2 OR i.para_user = ?2) AND u.banido = 0`,
  )
    .bind(id, eu.id)
    .first<{
      id: string;
      data: string;
      uid: string;
      nome: string;
      discord_username: string;
      discord_id: string;
      riot_id: string | null;
    }>();
  if (!linha) return c.json({ error: 'not_found' }, 404);

  return c.json({
    id: linha.id,
    data: linha.data,
    eu: { id: eu.id, nome: eu.nome },
    parceiro: {
      id: linha.uid,
      nome: linha.nome,
      riotId: linha.riot_id,
      discordUsername: linha.discord_username,
      // discord_id só tem dígitos (validado no login)
      discordUrl: `https://discord.com/users/${linha.discord_id}`,
    },
  });
});
