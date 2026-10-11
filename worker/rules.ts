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
