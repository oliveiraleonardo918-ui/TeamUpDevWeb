// RF05 (busca com filtros) e RF06 (perfil público com reputação).
// RN02: nada de Riot ID ou Discord aqui; isso só sai depois do match.
import { zValidator } from '@hono/zod-validator';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import type { AppEnv } from './env';
import { compatibilidade, ELOS, faixaElo, notaPublica, perfilCompleto } from './rules';

const LIMITE_BUSCA = 100;
const LIMITE_AVALIACOES = 20;

const filtrosSchema = z.object({
  eloMin: z.enum(ELOS).optional(),
  eloMax: z.enum(ELOS).optional(),
  complementar: z.literal('1').optional(),
  turno: z.enum(['manha', 'tarde', 'noite', 'madrugada']).optional(),
  estilo: z.enum(['casual', 'competitivo']).optional(),
  genero: z.enum(['mulher', 'homem', 'nao_binario']).optional(),
});

const entradaInvalida = (r: { success: boolean }, c: Context) => {
  if (!r.success) return c.json({ error: 'entrada_invalida' }, 400);
};

function lerTurnos(json: string | null): string[] {
  try {
    const v: unknown = JSON.parse(json ?? '[]');
    return Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

interface LinhaMeuPerfil {
  riot_id: string | null;
  elo: string | null;
  funcao_primaria: string | null;
  turnos: string | null;
  estilo: string | null;
}

interface LinhaCard {
  id: string;
  nome: string;
  elo: string | null;
  funcao_primaria: string | null;
  funcao_secundaria: string | null;
  turnos: string | null;
  estilo: string | null;
  media: number | null;
  total: number;
}

export const jogadores = new Hono<AppEnv>();

jogadores.get('/', zValidator('query', filtrosSchema, entradaInvalida), async (c) => {
  const eu = c.var.usuario;
  const f = c.req.valid('query');

  const meu = await c.env.DB.prepare(
    'SELECT riot_id, elo, funcao_primaria, turnos, estilo FROM profiles WHERE user_id = ?',
  )
    .bind(eu.id)
    .first<LinhaMeuPerfil>();
  const meusDados = {
    riotId: meu?.riot_id ?? null,
    elo: meu?.elo ?? null,
    funcaoPrimaria: meu?.funcao_primaria ?? null,
    turnos: lerTurnos(meu?.turnos ?? null),
    estilo: meu?.estilo ?? null,
  };
  // RN01: sem perfil mínimo a busca fica bloqueada
  if (!perfilCompleto(meusDados)) return c.json({ error: 'perfil_incompleto' }, 403);

  const elos = f.eloMin || f.eloMax ? JSON.stringify(faixaElo(f.eloMin, f.eloMax)) : null;
  // RN03: "só complementares" esconde quem tem a mesma função primária que a minha
  const minhaFuncao = f.complementar ? meusDados.funcaoPrimaria : null;

  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.nome, p.elo, p.funcao_primaria, p.funcao_secundaria, p.turnos, p.estilo,
            r.media, COALESCE(r.total, 0) AS total
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN (SELECT avaliado_id, AVG(nota) AS media, COUNT(*) AS total
                    FROM ratings GROUP BY avaliado_id) r ON r.avaliado_id = u.id
      WHERE u.banido = 0
        AND u.id <> ?1
        AND p.riot_id IS NOT NULL AND p.riot_id <> ''
        AND EXISTS (SELECT 1 FROM json_each(p.turnos))
        AND (?2 IS NULL OR p.elo IN (SELECT value FROM json_each(?2)))
        AND (?3 IS NULL OR p.funcao_primaria IS NULL OR p.funcao_primaria <> ?3)
        AND (?4 IS NULL OR EXISTS (SELECT 1 FROM json_each(p.turnos) WHERE value = ?4))
        AND (?5 IS NULL OR p.estilo = ?5)
        AND (?6 IS NULL OR (p.genero_visivel = 1 AND p.genero = ?6))
      LIMIT ?7`,
  )
    .bind(eu.id, elos, minhaFuncao, f.turno ?? null, f.estilo ?? null, f.genero ?? null, LIMITE_BUSCA)
    .all<LinhaCard>();

  const cards = results
    .map((l) => {
      const turnos = lerTurnos(l.turnos);
      const dados = { elo: l.elo, funcaoPrimaria: l.funcao_primaria, turnos, estilo: l.estilo };
      const card = {
        id: l.id,
        nome: l.nome,
        elo: l.elo,
        funcaoPrimaria: l.funcao_primaria,
        funcaoSecundaria: l.funcao_secundaria,
        turnos,
        estilo: l.estilo,
        nota: notaPublica(l.media, l.total),
        avaliacoes: l.total,
      };
      return { card, pontos: compatibilidade(meusDados, dados) };
    })
    .sort((a, b) => b.pontos - a.pontos || a.card.nome.localeCompare(b.card.nome))
    .map((r) => r.card);

  return c.json({ jogadores: cards });
});

interface LinhaPublica {
  id: string;
  nome: string;
  elo: string | null;
  funcao_primaria: string | null;
  funcao_secundaria: string | null;
  turnos: string | null;
  estilo: string | null;
  bio: string | null;
  genero: string | null;
  genero_visivel: number;
}

interface LinhaAvaliacao {
  nota: number;
  comentario: string;
  criado_em: string;
  autor_id: string;
  autor_nome: string;
}

jogadores.get(
  '/:id',
  zValidator('param', z.object({ id: z.string().uuid() }), (r, c) => {
    if (!r.success) return c.json({ error: 'not_found' }, 404);
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const db = c.env.DB;

    const linha = await db
      .prepare(
        `SELECT u.id, u.nome, p.elo, p.funcao_primaria, p.funcao_secundaria, p.turnos, p.estilo,
                p.bio, p.genero, p.genero_visivel
           FROM users u JOIN profiles p ON p.user_id = u.id
          WHERE u.id = ? AND u.banido = 0 AND p.riot_id IS NOT NULL AND p.riot_id <> ''`,
      )
      .bind(id)
      .first<LinhaPublica>();
    if (!linha) return c.json({ error: 'not_found' }, 404);

    const [distribuicao, comentarios] = await Promise.all([
      db
        .prepare('SELECT nota, COUNT(*) AS total FROM ratings WHERE avaliado_id = ? GROUP BY nota')
        .bind(id)
        .all<{ nota: number; total: number }>(),
      db
        .prepare(
          `SELECT r.nota, r.comentario, r.criado_em, a.id AS autor_id, a.nome AS autor_nome
             FROM ratings r JOIN users a ON a.id = r.autor_id
            WHERE r.avaliado_id = ? AND r.comentario IS NOT NULL AND r.comentario <> '' AND a.banido = 0
            ORDER BY r.criado_em DESC
            LIMIT ?`,
        )
        .bind(id, LIMITE_AVALIACOES)
        .all<LinhaAvaliacao>(),
    ]);

    const porNota = [0, 0, 0, 0, 0, 0];
    for (const d of distribuicao.results) porNota[d.nota] = d.total;
    const total = porNota.reduce((a, b) => a + b, 0);
    const media = total ? porNota.reduce((soma, n, nota) => soma + n * nota, 0) / total : null;
    const nota = notaPublica(media, total);

    return c.json({
      id: linha.id,
      nome: linha.nome,
      elo: linha.elo,
      funcaoPrimaria: linha.funcao_primaria,
      funcaoSecundaria: linha.funcao_secundaria,
      turnos: lerTurnos(linha.turnos),
      estilo: linha.estilo,
      bio: linha.bio,
      // RN05: gênero só aparece com consentimento
      genero: linha.genero_visivel === 1 ? linha.genero : null,
      reputacao: {
        nota,
        total,
        // Distribuição e notas individuais só com a nota pública liberada (mesma regra das 3 avaliações)
        distribuicao: nota === null ? null : porNota,
      },
      avaliacoes: comentarios.results.map((a) => ({
        autorId: a.autor_id,
        autorNome: a.autor_nome,
        data: a.criado_em,
        nota: nota === null ? null : a.nota,
        comentario: a.comentario,
      })),
    });
  },
);
