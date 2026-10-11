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
  podeTratarDenuncia,
  tipoImagem,
  validarEvidencias,
} from './rules';
import { avatarUrl, entradaInvalida, naoEncontrado } from './util';

const idParam = z.object({ id: z.string().uuid() });

export const denuncias = new Hono<AppEnv>();

const camposDenuncia = z.object({
  denunciadoId: z.string().uuid(),
  motivo: z.enum(MOTIVOS_DENUNCIA),
  descricao: z.string().trim().max(500).optional(),
});

/**
 * RF11: denúncia com até 3 imagens de evidência (multipart/form-data, campo "evidencias").
 * O tipo é conferido pelos bytes do arquivo; tamanho e quantidade em validarEvidencias.
 */
denuncias.post('/', async (c) => {
  const eu = c.var.usuario.id;
  let corpo: Record<string, string | File | (string | File)[]>;
  try {
    corpo = await c.req.parseBody({ all: true });
  } catch {
    return c.json({ error: 'entrada_invalida' }, 400);
  }
  const campos = camposDenuncia.safeParse({
    denunciadoId: corpo.denunciadoId,
    motivo: corpo.motivo,
    descricao: typeof corpo.descricao === 'string' && corpo.descricao.trim() ? corpo.descricao : undefined,
  });
  if (!campos.success) return c.json({ error: 'entrada_invalida' }, 400);
  const { denunciadoId, motivo, descricao } = campos.data;

  const enviados = ([] as (string | File)[]).concat(corpo.evidencias ?? []);
  if (enviados.some((v) => typeof v === 'string')) return c.json({ error: 'entrada_invalida' }, 400);
  const arquivos = enviados as File[];
  // Confere quantidade e tamanho antes de ler o conteúdo
  const previa = validarEvidencias(arquivos.map((a) => ({ tamanho: a.size, tipo: 'image/png' })));
  if (previa) return c.json({ error: previa }, 400);
  const evidencias = await Promise.all(
    arquivos.map(async (a) => {
      const bytes = new Uint8Array(await a.arrayBuffer());
      return { bytes, tamanho: bytes.byteLength, tipo: tipoImagem(bytes) };
    }),
  );
  const erroArquivo = validarEvidencias(evidencias);
  if (erroArquivo) return c.json({ error: erroArquivo }, 400);

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

  const id = crypto.randomUUID();
  await db.batch([
    db
      .prepare('INSERT INTO reports (id, autor_id, denunciado_id, motivo, descricao) VALUES (?, ?, ?, ?, ?)')
      .bind(id, eu, denunciadoId, motivo, descricao || null),
    ...evidencias.map((e) =>
      db
        .prepare('INSERT INTO evidencias (id, denuncia_id, tipo, tamanho, dados) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), id, e.tipo, e.tamanho, e.bytes),
    ),
  ]);
  return c.body(null, 201);
});

const somenteEquipe = createMiddleware<AppEnv>(async (c, next) => {
  if (!podeModerar(c.var.usuario.papel)) return c.json({ error: 'sem_permissao' }, 403);
  await next();
});

export const moderacao = new Hono<AppEnv>();
moderacao.use('*', somenteEquipe);

interface LinhaEvidencia {
  id: string;
  denuncia_id: string;
  tipo: string;
  tamanho: number;
}

/** Metadados das evidências de uma denúncia (a imagem em si sai por /evidencias/:id). */
function porDenuncia(lista: LinhaEvidencia[], denunciaId: string) {
  return lista.filter((e) => e.denuncia_id === denunciaId).map((e) => ({ id: e.id, tipo: e.tipo, tamanho: e.tamanho }));
}

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
  const [resumo, abertas, evidencias] = await Promise.all([
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
        `SELECT e.id, e.denuncia_id, e.tipo, e.tamanho FROM evidencias e
           JOIN reports r ON r.id = e.denuncia_id WHERE r.status = 'aberta' ORDER BY e.criado_em`,
      )
      .all<LinhaEvidencia>(),
  ]);

  return c.json({
    resumo: {
      abertas: resumo?.abertas ?? 0,
      arquivadasHoje: resumo?.arquivadas_hoje ?? 0,
      contasSuspensas: resumo?.suspensas ?? 0,
    },
    denuncias: abertas.results.map((d) => {
      const denunciado = { id: d.alvo_id, papel: papelEfetivo(d.alvo_discord_id, d.alvo_papel, admins) };
      const eu = { id: c.var.usuario.id, papel: c.var.usuario.papel };
      return {
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
      evidencias: porDenuncia(evidencias.results, d.id),
      // O que quem está vendo pode fazer (null = pode); a tela mostra o motivo quando não pode
      bloqueio: {
        arquivar: podeTratarDenuncia(eu, denunciado, 'arquivar'),
        banir: podeTratarDenuncia(eu, denunciado, 'banir'),
      },
      };
    }),
  });
});

/** Aba "Usuários banidos": motivo, quem baniu, quando, e as denúncias com evidências contra a pessoa. */
moderacao.get('/banidos', async (c) => {
  const db = c.env.DB;
  const [banidos, denunciasContra, evidencias] = await Promise.all([
    db
      .prepare(
        `SELECT u.id, u.nome, u.discord_username, u.discord_id, u.avatar,
                l.motivo, l.criado_em AS banido_em, a.nome AS banido_por
           FROM users u
           LEFT JOIN moderacao_log l ON l.id = (
             SELECT id FROM moderacao_log WHERE alvo_id = u.id AND acao = 'banir' ORDER BY criado_em DESC LIMIT 1)
           LEFT JOIN users a ON a.id = l.autor_id
          WHERE u.banido = 1
          ORDER BY l.criado_em DESC
          LIMIT 100`,
      )
      .all<{
        id: string;
        nome: string;
        discord_username: string;
        discord_id: string;
        avatar: string | null;
        motivo: string | null;
        banido_em: string | null;
        banido_por: string | null;
      }>(),
    db
      .prepare(
        `SELECT r.id, r.denunciado_id, r.motivo, r.descricao, r.criado_em, a.id AS autor_id, a.nome AS autor_nome
           FROM reports r JOIN users a ON a.id = r.autor_id
           JOIN users d ON d.id = r.denunciado_id
          WHERE d.banido = 1
          ORDER BY r.criado_em DESC`,
      )
      .all<{
        id: string;
        denunciado_id: string;
        motivo: string;
        descricao: string | null;
        criado_em: string;
        autor_id: string;
        autor_nome: string;
      }>(),
    db
      .prepare(
        `SELECT e.id, e.denuncia_id, e.tipo, e.tamanho FROM evidencias e
           JOIN reports r ON r.id = e.denuncia_id JOIN users d ON d.id = r.denunciado_id
          WHERE d.banido = 1 ORDER BY e.criado_em`,
      )
      .all<LinhaEvidencia>(),
  ]);

  return c.json({
    banidos: banidos.results.map((b) => ({
      id: b.id,
      nome: b.nome,
      discordUsername: b.discord_username,
      avatarUrl: avatarUrl(b.discord_id, b.avatar),
      motivo: b.motivo,
      banidoEm: b.banido_em,
      banidoPor: b.banido_por,
      denuncias: denunciasContra.results
        .filter((r) => r.denunciado_id === b.id)
        .map((r) => ({
          id: r.id,
          motivo: r.motivo,
          descricao: r.descricao,
          data: r.criado_em,
          denunciante: { id: r.autor_id, nome: r.autor_nome },
          evidencias: porDenuncia(evidencias.results, r.id),
        })),
    })),
  });
});

/** Imagem de uma evidência, só para a equipe. Tipo conferido no upload; nunca é executada pelo navegador. */
moderacao.get('/evidencias/:id', zValidator('param', idParam, naoEncontrado), async (c) => {
  const { id } = c.req.valid('param');
  const e = await c.env.DB.prepare('SELECT tipo, dados FROM evidencias WHERE id = ?')
    .bind(id)
    .first<{ tipo: string; dados: ArrayBuffer | number[] }>();
  if (!e) return c.json({ error: 'not_found' }, 404);
  const bytes = e.dados instanceof ArrayBuffer ? new Uint8Array(e.dados) : Uint8Array.from(e.dados);
  return c.body(bytes, 200, {
    'Content-Type': e.tipo,
    'Content-Disposition': 'inline',
    'Cache-Control': 'private, no-store',
    'Content-Security-Policy': "default-src 'none'; img-src 'self'; sandbox",
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
    const denuncia = await c.env.DB.prepare(
      `SELECT r.denunciado_id, d.discord_id, d.papel FROM reports r JOIN users d ON d.id = r.denunciado_id
        WHERE r.id = ? AND r.status = 'aberta'`,
    )
      .bind(id)
      .first<{ denunciado_id: string; discord_id: string; papel: string }>();
    if (!denuncia) return c.json({ error: 'denuncia_indisponivel' }, 404);
    const bloqueio = podeTratarDenuncia(
      { id: eu, papel: c.var.usuario.papel },
      {
        id: denuncia.denunciado_id,
        papel: papelEfetivo(denuncia.discord_id, denuncia.papel, listaAdmins(c.env.ADMIN_DISCORD_IDS)),
      },
      'arquivar',
    );
    if (bloqueio) return c.json({ error: bloqueio }, 403);

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

    const papelAlvo = papelEfetivo(alvo.discord_id, alvo.papel, listaAdmins(c.env.ADMIN_DISCORD_IDS));
    const bloqueio = podeTratarDenuncia({ id: eu.id, papel: eu.papel }, { id: alvo.id, papel: papelAlvo }, 'banir');
    if (bloqueio) return c.json({ error: bloqueio }, 403);
    const erro = podeBanir({ id: eu.id, papel: eu.papel }, { id: alvo.id, papel: papelAlvo, banido: alvo.banido === 1 });
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
