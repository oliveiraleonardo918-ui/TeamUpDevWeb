// Regras de negócio puras (sem I/O), fáceis de testar.

export type Role = 'duelista' | 'iniciador' | 'controlador' | 'sentinela';

export interface ProfileMinimo {
  riotId?: string | null;
  turnos?: string[] | null;
}

/** RN01: perfil mínimo = jogo (Valorant, fixo no MVP) + Riot ID + 1 turno. */
export function perfilCompleto(p: ProfileMinimo): boolean {
  return Boolean(p.riotId?.trim()) && (p.turnos?.length ?? 0) > 0;
}

/** RN03: função complementar nunca retorna a mesma função primária. */
export function funcaoComplementar(minha: Role, candidato: Role): boolean {
  return minha !== candidato;
}

/** RF10: nota de 0 a 5, inteira. */
export function notaValida(nota: number): boolean {
  return Number.isInteger(nota) && nota >= 0 && nota <= 5;
}

/** RNF04: rotas da API que não exigem sessão. */
export function rotaPublica(caminho: string): boolean {
  return caminho === '/api/health' || caminho.startsWith('/api/auth/');
}

export type DecisaoLogin = 'criar' | 'entrar' | 'suspenso' | 'maioridade_pendente';

/**
 * Resultado do callback do Discord.
 * RN07: banido não loga. RN06: conta nova só com a declaração de 18+ feita na tela de entrada.
 */
export function decidirLogin(p: { existe: boolean; banido: boolean; declarouMaioridade: boolean }): DecisaoLogin {
  if (p.existe) return p.banido ? 'suspenso' : 'entrar';
  return p.declarouMaioridade ? 'criar' : 'maioridade_pendente';
}
