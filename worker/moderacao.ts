// RF11 (denunciar) e RF12 (equipe lista denúncias, arquiva e bane). RN07: banido perde o acesso na hora.
// A identidade de quem denuncia nunca sai para o denunciado: só a equipe vê.
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
import type { AppEnv } from './env';
import {
  listaAdmins,
  MOTIVOS_DENUNCIA,
  papelEfetivo,
  podeBanir,
  podeDenunciar,
  podeDesbanir,
  podeModerar,
} from './rules';
import { avatarUrl, entradaInvalida, naoEncontrado } from './util';

const idParam = z.object({ id: z.string().uuid() });

export const denuncias = new Hono<AppEnv>();

denuncias.post(
  '/',
  zValidator(
    'json',
    z.object({
      denunciadoId: z.string().uuid(),
      motivo: z.enum(MOTIVOS_DENUNCIA),
      descricao: z.string().trim().max(500).optional(),
    }),
    entradaInvalida,
  ),
  async (c) => {
    const eu = c.var.usuario.id;
    const { denunciadoId, motivo, descricao } = c.req.valid('json');
    const db = c.env.DB;

    const [alvo, aberta, hoje] = await Promise.all([
      db.prepare('SELECT id FROM users WHERE id = ? AND banido = 0').bind(denunciadoId).first<{ id: string }>(),
      db
        .prepare("SELECT 1 AS sim FROM reports WHERE autor_id = ? AND denunciado_id = ? AND status = 'aberta'")
        .bind(eu, denunciadoId)
        .first<{ sim: number }>(),
      db
        .prepare("SELECT COUNT(*) AS n FROM reports WHERE autor_id = ? AND criado_em > datetime('now', '-1 day')")
        .bind(eu)
        .first<{ n: number }>(),
    ]);
    if (!alvo) return c.json({ error: 'not_found' }, 404);

    const erro = podeDenunciar({
      euId: eu,
      alvoId: denunciadoId,
      jaTemAbertaContraAlvo: aberta !== null,
      denunciasHoje: hoje?.n ?? 0,
    });
    if (erro) return c.json({ error: erro }, erro === 'proprio_usuario' ? 400 : 409);

    await db
      .prepare('INSERT INTO reports (id, autor_id, denunciado_id, motivo, descricao) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), eu, denunciadoId, motivo, descricao || null)
      .run();
    return c.body(null, 201);
  },
);

const somenteEquipe = createMiddleware<AppEnv>(async (c, next) => {
  if (!podeModerar(c.var.usuario.papel)) return c.json({ error: 'sem_permissao' }, 403);
  await next();
});

export const moderacao = new Hono<AppEnv>();
moderacao.use('*', somenteEquipe);

interface LinhaDenuncia {
  id: string;
  motivo: string;
  descricao: string | null;
  criado_em: string;
  autor_id: string;
  autor_nome: string;
  alvo_id: string;
  alvo_nome: string;
  alvo_discord_id: string;
  alvo_avatar: string | null;
  alvo_papel: string;
}

moderacao.get('/', async (c) => {
  const db = c.env.DB;
  const admins = listaAdmins(c.env.ADMIN_DISCORD_IDS);
  const [resumo, abertas, banidos] = await Promise.all([
    db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM reports WHERE status = 'aberta') AS abertas,
           (SELECT COUNT(*) FROM reports
             WHERE resolucao = 'arquivada' AND resolvido_em >= datetime('now', 'start of day')) AS arquivadas_hoje,
           (SELECT COUNT(*) FROM users WHERE banido = 1) AS suspensas`,
      )
      .first<{ abertas: number; arquivadas_hoje: number; suspensas: number }>(),
    db
      .prepare(
        `SELECT r.id, r.motivo, r.descricao, r.criado_em,
                a.id AS autor_id, a.nome AS autor_nome,
                d.id AS alvo_id, d.nome AS alvo_nome, d.discord_id AS alvo_discord_id, d.avatar AS alvo_avatar,
                d.papel AS alvo_papel
           FROM reports r
           JOIN users a ON a.id = r.autor_id
           JOIN users d ON d.id = r.denunciado_id
          WHERE r.status = 'aberta'
          ORDER BY r.criado_em DESC
          LIMIT 100`,
      )
      .all<LinhaDenuncia>(),
    db
      .prepare(
        `SELECT u.id, u.nome, u.discord_username, u.discord_id, u.avatar,
                (SELECT l.motivo FROM moderacao_log l
                  WHERE l.alvo_id = u.id AND l.acao = 'banir' ORDER BY l.criado_em DESC LIMIT 1) AS motivo
           FROM users u WHERE u.banido = 1 ORDER BY u.nome LIMIT 100`,
      )
      .all<{
        id: string;
        nome: string;
        discord_username: string;
        discord_id: string;
        avatar: string | null;
        motivo: string | null;
      }>(),
  ]);

  return c.json({
    resumo: {
      abertas: resumo?.abertas ?? 0,
      arquivadasHoje: resumo?.arquivadas_hoje ?? 0,
      contasSuspensas: resumo?.suspensas ?? 0,
    },
    denuncias: abertas.results.map((d) => ({
      id: d.id,
      motivo: d.motivo,
      descricao: d.descricao,
      data: d.criado_em,
      denunciante: { id: d.autor_id, nome: d.autor_nome },
      denunciado: {
        id: d.alvo_id,
        nome: d.alvo_nome,
        avatarUrl: avatarUrl(d.alvo_discord_id, d.alvo_avatar),
        papel: papelEfetivo(d.alvo_discord_id, d.alvo_papel, admins),
      },
    })),
    banidos: banidos.results.map((b) => ({
      id: b.id,
      nome: b.nome,
      discordUsername: b.discord_username,
      avatarUrl: avatarUrl(b.discord_id, b.avatar),
      motivo: b.motivo,
    })),
  });
});

moderacao.post(
  '/denuncias/:id/arquivar',
  zValidator('param', idParam, naoEncontrado),
  zValidator('json', z.object({ motivo: z.string().trim().max(280).optional() }), entradaInvalida),
  async (c) => {
    const { id } = c.req.valid('param');
    const { motivo } = c.req.valid('json');
    const eu = c.var.usuario.id;
    const denuncia = await c.env.DB.prepare("SELECT denunciado_id FROM reports WHERE id = ? AND status = 'aberta'")
      .bind(id)
      .first<{ denunciado_id: string }>();
    if (!denuncia) return c.json({ error: 'denuncia_indisponivel' }, 404);

    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE reports SET status = 'resolvida', resolucao = 'arquivada', resolvido_em = datetime('now'), resolvido_por = ?
          WHERE id = ? AND status = 'aberta'`,
      ).bind(eu, id),
      c.env.DB.prepare(
        `INSERT INTO moderacao_log (id, autor_id, acao, alvo_id, denuncia_id, motivo)
         VALUES (?, ?, 'arquivar_denuncia', ?, ?, ?)`,
      ).bind(crypto.randomUUID(), eu, denuncia.denunciado_id, id, motivo || null),
    ]);
    return c.body(null, 204);
  },
);

interface LinhaUsuario {
  id: string;
  discord_id: string;
  papel: string;
  banido: number;
}

moderacao.post(
  '/usuarios/:id/banir',
  zValidator('param', idParam, naoEncontrado),
  zValidator(
    'json',
    z.object({ motivo: z.string().trim().min(5).max(280), denunciaId: z.string().uuid().optional() }),
    entradaInvalida,
  ),
  async (c) => {
    const { id } = c.req.valid('param');
    const { motivo, denunciaId } = c.req.valid('json');
    const eu = c.var.usuario;
    const db = c.env.DB;
    const alvo = await db.prepare('SELECT id, discord_id, papel, banido FROM users WHERE id = ?').bind(id).first<LinhaUsuario>();
    if (!alvo) return c.json({ error: 'not_found' }, 404);

    const erro = podeBanir(
      { id: eu.id, papel: eu.papel },
      {
        id: alvo.id,
        papel: papelEfetivo(alvo.discord_id, alvo.papel, listaAdmins(c.env.ADMIN_DISCORD_IDS)),
        banido: alvo.banido === 1,
      },
    );
    if (erro) return c.json({ error: erro }, erro === 'sem_permissao' ? 403 : 409);

    await db.batch([
      // Banido deixa de ser moderador (se era) e perde as sessões abertas (RN07)
      db.prepare("UPDATE users SET banido = 1, papel = 'jogador' WHERE id = ?").bind(alvo.id),
      db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(alvo.id),
      // Todas as denúncias abertas contra a pessoa ficam resolvidas pelo banimento
      db
        .prepare(
          `UPDATE reports SET status = 'resolvida', resolucao = 'banido', resolvido_em = datetime('now'), resolvido_por = ?
            WHERE denunciado_id = ? AND status = 'aberta'`,
        )
        .bind(eu.id, alvo.id),
      db
        .prepare(
          `INSERT INTO moderacao_log (id, autor_id, acao, alvo_id, denuncia_id, motivo)
           VALUES (?, ?, 'banir', ?, (SELECT id FROM reports WHERE id = ?), ?)`,
        )
        .bind(crypto.randomUUID(), eu.id, alvo.id, denunciaId ?? null, motivo),
    ]);
    return c.body(null, 204);
  },
);

moderacao.post(
  '/usuarios/:id/desbanir',
  zValidator('param', idParam, naoEncontrado),
  zValidator('json', z.object({ motivo: z.string().trim().min(5).max(280) }), entradaInvalida),
  async (c) => {
    const { id } = c.req.valid('param');
    const { motivo } = c.req.valid('json');
    const eu = c.var.usuario;
    const alvo = await c.env.DB.prepare('SELECT id, banido FROM users WHERE id = ?').bind(id).first<{ id: string; banido: number }>();
    if (!alvo) return c.json({ error: 'not_found' }, 404);

    const erro = podeDesbanir({ papel: eu.papel }, { banido: alvo.banido === 1 });
    if (erro) return c.json({ error: erro }, erro === 'sem_permissao' ? 403 : 409);

    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE users SET banido = 0 WHERE id = ?').bind(alvo.id),
      c.env.DB.prepare(
        "INSERT INTO moderacao_log (id, autor_id, acao, alvo_id, motivo) VALUES (?, ?, 'desbanir', ?, ?)",
      ).bind(crypto.randomUUID(), eu.id, alvo.id, motivo),
    ]);
    return c.body(null, 204);
  },
);
