// RF07 (enviar convite), RF08 (ver, aceitar e recusar), RF09 (contatos após o match) e RF10 (avaliação).
// RN02: match só com aceite mútuo; Riot ID e Discord só para os dois participantes.
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from './env';
import {
  COMENTARIO_MAX,
  DIAS_APOS_RECUSA,
  notaPublica,
  notaValida,
  perfilCompleto,
  podeAvaliar,
  podeConvidar,
} from './rules';
import { avatarUrl, conviteEntre, entradaInvalida, lerTurnos, naoEncontrado } from './util';

const LIMITE_LISTA = 50;

const idSchema = z.object({ id: z.string().uuid() });

interface LinhaConvite {
  id: string;
  status: 'pendente' | 'aceito' | 'recusado';
  criado_em: string;
  respondido_em: string | null;
  uid: string;
  nome: string;
  discord_id: string;
  avatar: string | null;
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
      avatarUrl: avatarUrl(l.discord_id, l.avatar),
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
        `SELECT i.id, i.status, i.criado_em, i.respondido_em, u.id AS uid, u.nome, u.discord_id, u.avatar,
                p.elo, p.funcao_primaria, p.funcao_secundaria, p.turnos, p.estilo,
                r.media, COALESCE(r.total, 0) AS total
           FROM invites i
           JOIN users u ON u.id = i.de_user
           LEFT JOIN profiles p ON p.user_id = u.id
           LEFT JOIN (SELECT avaliado_id, AVG(nota) AS media, COUNT(*) AS total
                        FROM ratings GROUP BY avaliado_id) r ON r.avaliado_id = u.id
          WHERE i.para_user = ? AND i.status = 'pendente' AND u.banido = 0 AND u.excluido_em IS NULL
          ORDER BY i.criado_em DESC
          LIMIT ?`,
      )
      .bind(eu, LIMITE_LISTA)
      .all<LinhaConvite>(),
    db
      .prepare(
        `SELECT i.id, i.status, i.criado_em, i.respondido_em, u.id AS uid, u.nome, u.discord_id, u.avatar,
                p.elo, p.funcao_primaria, p.funcao_secundaria, p.turnos, p.estilo,
                r.media, COALESCE(r.total, 0) AS total
           FROM invites i
           JOIN users u ON u.id = i.para_user
           LEFT JOIN profiles p ON p.user_id = u.id
           LEFT JOIN (SELECT avaliado_id, AVG(nota) AS media, COUNT(*) AS total
                        FROM ratings GROUP BY avaliado_id) r ON r.avaliado_id = u.id
          WHERE i.de_user = ? AND u.banido = 0 AND u.excluido_em IS NULL
          ORDER BY i.criado_em DESC
          LIMIT ?`,
      )
      .bind(eu, LIMITE_LISTA)
      .all<LinhaConvite>(),
  ]);
  return c.json({ recebidos: recebidos.results.map(paraConvite), enviados: enviados.results.map(paraConvite) });
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
            u.id AS uid, u.nome, u.discord_id, u.avatar, p.elo, p.funcao_primaria,
            mr.nota AS minha_nota, mr.criado_em AS avaliado_em
       FROM invites i
       JOIN users u ON u.id = CASE WHEN i.de_user = ?1 THEN i.para_user ELSE i.de_user END
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN ratings mr ON mr.invite_id = i.id AND mr.autor_id = ?1
      WHERE i.status = 'aceito' AND (i.de_user = ?1 OR i.para_user = ?1) AND u.banido = 0 AND u.excluido_em IS NULL
      ORDER BY data DESC
      LIMIT 100`,
  )
    .bind(c.var.usuario.id)
    .all<{
      id: string;
      data: string;
      uid: string;
      nome: string;
      discord_id: string;
      avatar: string | null;
      elo: string | null;
      funcao_primaria: string | null;
      minha_nota: number | null;
      avaliado_em: string | null;
    }>();

  return c.json({
    matches: results.map((m) => ({
      id: m.id,
      data: m.data,
      jogador: {
        id: m.uid,
        nome: m.nome,
        avatarUrl: avatarUrl(m.discord_id, m.avatar),
        elo: m.elo,
        funcaoPrimaria: m.funcao_primaria,
      },
      minhaAvaliacao: m.minha_nota === null ? null : { nota: m.minha_nota, data: m.avaliado_em },
    })),
  });
});

/** RF09: contatos do parceiro. Só os dois participantes enxergam (senão 404, sem revelar que existe). */
matches.get('/:id', zValidator('param', idSchema, naoEncontrado), async (c) => {
  const eu = c.var.usuario;
  const { id } = c.req.valid('param');
  const linha = await c.env.DB.prepare(
    `SELECT i.id, COALESCE(i.respondido_em, i.criado_em) AS data,
            u.id AS uid, u.nome, u.discord_username, u.discord_id, u.avatar, p.riot_id,
            mr.nota AS minha_nota, mr.comentario AS meu_comentario, mr.criado_em AS avaliado_em,
            r.media, COALESCE(r.total, 0) AS total
       FROM invites i
       JOIN users u ON u.id = CASE WHEN i.de_user = ?2 THEN i.para_user ELSE i.de_user END
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN ratings mr ON mr.invite_id = i.id AND mr.autor_id = ?2
       LEFT JOIN (SELECT avaliado_id, AVG(nota) AS media, COUNT(*) AS total
                    FROM ratings GROUP BY avaliado_id) r ON r.avaliado_id = u.id
      WHERE i.id = ?1 AND i.status = 'aceito' AND (i.de_user = ?2 OR i.para_user = ?2) AND u.banido = 0
        AND u.excluido_em IS NULL`,
  )
    .bind(id, eu.id)
    .first<{
      id: string;
      data: string;
      uid: string;
      nome: string;
      discord_username: string;
      discord_id: string;
      avatar: string | null;
      riot_id: string | null;
      minha_nota: number | null;
      meu_comentario: string | null;
      avaliado_em: string | null;
      media: number | null;
      total: number;
    }>();
  if (!linha) return c.json({ error: 'not_found' }, 404);

  return c.json({
    id: linha.id,
    data: linha.data,
    eu: { id: eu.id, nome: eu.nome, avatarUrl: avatarUrl(eu.discordId, eu.avatar) },
    parceiro: {
      id: linha.uid,
      nome: linha.nome,
      avatarUrl: avatarUrl(linha.discord_id, linha.avatar),
      riotId: linha.riot_id,
      discordUsername: linha.discord_username,
      // discord_id só tem dígitos (validado no login)
      discordUrl: `https://discord.com/users/${linha.discord_id}`,
      reputacao: { nota: notaPublica(linha.media, linha.total), total: linha.total },
    },
    minhaAvaliacao:
      linha.minha_nota === null
        ? null
        : { nota: linha.minha_nota, comentario: linha.meu_comentario, data: linha.avaliado_em },
  });
});

const avaliacaoSchema = z.object({
  nota: z.number().int().refine(notaValida, 'nota_invalida'),
  comentario: z.string().trim().max(COMENTARIO_MAX).optional(),
});

/** RF10 + RN04: avaliar o parceiro do match, uma vez. */
matches.post(
  '/:id/avaliacao',
  zValidator('param', idSchema, naoEncontrado),
  zValidator('json', avaliacaoSchema, entradaInvalida),
  async (c) => {
    const eu = c.var.usuario.id;
    const { id } = c.req.valid('param');
    const { nota, comentario } = c.req.valid('json');
    const db = c.env.DB;

    const match = await db
      .prepare(
        `SELECT i.status, i.de_user, i.para_user,
                (SELECT 1 FROM ratings WHERE invite_id = i.id AND autor_id = ?2) AS ja_avaliou
           FROM invites i
           JOIN users u ON u.id = CASE WHEN i.de_user = ?2 THEN i.para_user ELSE i.de_user END
          WHERE i.id = ?1 AND u.banido = 0 AND u.excluido_em IS NULL`,
      )
      .bind(id, eu)
      .first<{ status: string; de_user: string; para_user: string; ja_avaliou: number | null }>();

    const motivo = podeAvaliar({
      participante: match !== null && (match.de_user === eu || match.para_user === eu),
      matchAceito: match?.status === 'aceito',
      jaAvaliou: match?.ja_avaliou === 1,
    });
    if (motivo === 'nao_encontrado' || !match) return c.json({ error: 'not_found' }, 404);
    if (motivo) return c.json({ error: motivo }, 409);

    const avaliado = match.de_user === eu ? match.para_user : match.de_user;
    try {
      await db
        .prepare(
          'INSERT INTO ratings (id, invite_id, autor_id, avaliado_id, nota, comentario) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind(crypto.randomUUID(), id, eu, avaliado, nota, comentario || null)
        .run();
    } catch {
      // UNIQUE(invite_id, autor_id): envio duplicado ao mesmo tempo
      return c.json({ error: 'ja_avaliado' }, 409);
    }

    const rep = await db
      .prepare('SELECT AVG(nota) AS media, COUNT(*) AS total FROM ratings WHERE avaliado_id = ?')
      .bind(avaliado)
      .first<{ media: number | null; total: number }>();
    return c.json({ reputacao: { nota: notaPublica(rep?.media ?? null, rep?.total ?? 0), total: rep?.total ?? 0 } }, 201);
  },
);
