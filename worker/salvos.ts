// RF15 (salvar jogadores para ver depois) e RN10 (lista privada, limite, sem dados de contato).
// RN02: nada de Riot ID ou Discord aqui; só os dados públicos do card da busca.
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from './env';
import { notaPublica, podeSalvar } from './rules';
import { avatarUrl, entradaInvalida, lerTurnos, naoEncontrado } from './util';

interface LinhaSalvo {
  id: string;
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

export const salvos = new Hono<AppEnv>();

// Meus salvos, no formato do card da busca. Banido ou conta excluída somem da lista (RN07),
// mas o registro fica: se a conta for desbanida, volta a aparecer.
salvos.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.nome, u.discord_id, u.avatar, p.elo, p.funcao_primaria, p.funcao_secundaria, p.turnos, p.estilo,
            r.media, COALESCE(r.total, 0) AS total
       FROM salvos s
       JOIN users u ON u.id = s.salvo_id
       JOIN profiles p ON p.user_id = u.id
       LEFT JOIN (SELECT avaliado_id, AVG(nota) AS media, COUNT(*) AS total
                    FROM ratings_validas GROUP BY avaliado_id) r ON r.avaliado_id = u.id
      WHERE s.user_id = ?
        AND u.banido = 0
        AND u.excluido_em IS NULL
      ORDER BY s.criado_em DESC`,
  )
    .bind(c.var.usuario.id)
    .all<LinhaSalvo>();

  const jogadores = results.map((l) => ({
    id: l.id,
    nome: l.nome,
    avatarUrl: avatarUrl(l.discord_id, l.avatar),
    elo: l.elo,
    funcaoPrimaria: l.funcao_primaria,
    funcaoSecundaria: l.funcao_secundaria,
    turnos: lerTurnos(l.turnos),
    estilo: l.estilo,
    nota: notaPublica(l.media, l.total),
    avaliacoes: l.total,
  }));
  return c.json({ jogadores });
});

// Salvar um jogador (RN10: não a si mesmo, não duas vezes, no máximo MAX_SALVOS)
salvos.post('/', zValidator('json', z.object({ jogadorId: z.string().uuid() }), entradaInvalida), async (c) => {
  const eu = c.var.usuario.id;
  const { jogadorId } = c.req.valid('json');
  const db = c.env.DB;

  const [alvo, jaSalvo, total] = await Promise.all([
    // Só jogadores visíveis na busca: não banido, conta ativa e com perfil
    db
      .prepare(
        `SELECT u.id FROM users u JOIN profiles p ON p.user_id = u.id
          WHERE u.id = ? AND u.banido = 0 AND u.excluido_em IS NULL AND p.riot_id IS NOT NULL AND p.riot_id <> ''`,
      )
      .bind(jogadorId)
      .first<{ id: string }>(),
    db.prepare('SELECT 1 AS sim FROM salvos WHERE user_id = ? AND salvo_id = ?').bind(eu, jogadorId).first<{ sim: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM salvos WHERE user_id = ?').bind(eu).first<{ n: number }>(),
  ]);
  if (!alvo) return c.json({ error: 'not_found' }, 404);

  const motivo = podeSalvar({ euId: eu, alvoId: jogadorId, jaSalvo: jaSalvo !== null, totalSalvos: total?.n ?? 0 });
  if (motivo) return c.json({ error: motivo }, motivo === 'proprio_usuario' ? 400 : 409);

  await db.prepare('INSERT OR IGNORE INTO salvos (user_id, salvo_id) VALUES (?, ?)').bind(eu, jogadorId).run();
  return c.body(null, 201);
});

// Remover dos meus salvos (só apaga registros em que eu sou quem salvou)
salvos.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() }), naoEncontrado), async (c) => {
  const { id } = c.req.valid('param');
  const r = await c.env.DB.prepare('DELETE FROM salvos WHERE user_id = ? AND salvo_id = ?')
    .bind(c.var.usuario.id, id)
    .run();
  if (r.meta.changes === 0) return c.json({ error: 'not_found' }, 404);
  return c.body(null, 204);
});