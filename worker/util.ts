// Utilidades compartilhadas pelas rotas da API.
import type { Context } from 'hono';
import type { AppEnv } from './env';

/** Hook do zValidator: entrada inválida vira 400 com corpo genérico (sem detalhes do Zod). */
export const entradaInvalida = (r: { success: boolean }, c: Context) => {
  if (!r.success) return c.json({ error: 'entrada_invalida' }, 400);
};

/** Hook do zValidator para ids na URL: id malformado vira 404, como um id que não existe. */
export const naoEncontrado = (r: { success: boolean }, c: Context) => {
  if (!r.success) return c.json({ error: 'not_found' }, 404);
};

/** Lê a coluna profiles.turnos (JSON) sem quebrar se vier vazia ou inválida. */
export function lerTurnos(json: string | null): string[] {
  try {
    const v: unknown = JSON.parse(json ?? '[]');
    return Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

export interface ConviteEntrePar {
  id: string;
  status: 'pendente' | 'aceito';
  enviadoPorMim: boolean;
}

/** Convite ativo entre dois jogadores (match aceito tem prioridade sobre pendente). */
export async function conviteEntre(c: Context<AppEnv>, eu: string, outro: string): Promise<ConviteEntrePar | null> {
  const linha = await c.env.DB.prepare(
    `SELECT id, de_user, status FROM invites
      WHERE ((de_user = ?1 AND para_user = ?2) OR (de_user = ?2 AND para_user = ?1))
        AND status IN ('pendente', 'aceito')
      ORDER BY status = 'aceito' DESC
      LIMIT 1`,
  )
    .bind(eu, outro)
    .first<{ id: string; de_user: string; status: 'pendente' | 'aceito' }>();
  return linha ? { id: linha.id, status: linha.status, enviadoPorMim: linha.de_user === eu } : null;
}
