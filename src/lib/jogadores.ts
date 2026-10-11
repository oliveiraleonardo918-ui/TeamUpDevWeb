// Busca de duos (RF05) e perfil público (RF06).
import { api } from './api';
import { ELOS, ESTILOS, FUNCOES, GENEROS, TURNOS, type Elo, type Estilo, type Funcao, type Genero, type Turno } from './perfil';

export interface CardJogador {
  id: string;
  nome: string;
  elo: Elo | null;
  funcaoPrimaria: Funcao | null;
  funcaoSecundaria: Funcao | null;
  turnos: Turno[];
  estilo: Estilo | null;
  /** null = menos de 3 avaliações ("Novo jogador") */
  nota: number | null;
  avaliacoes: number;
}

export interface AvaliacaoRecebida {
  autorId: string;
  autorNome: string;
  data: string;
  nota: number | null;
  comentario: string;
}

export type Relacao = 'nenhuma' | 'convite_enviado' | 'convite_recebido' | 'match' | 'proprio';

export interface PerfilPublico extends Omit<CardJogador, 'nota' | 'avaliacoes'> {
  relacao: Relacao;
  matchId: string | null;
  bio: string | null;
  genero: Genero | null;
  reputacao: {
    nota: number | null;
    total: number;
    /** Quantidade de avaliações por nota (índice = nota, de 1 a 5; o índice 0 fica sempre zerado); null antes de 3 avaliações */
    distribuicao: number[] | null;
  };
  avaliacoes: AvaliacaoRecebida[];
}

export interface Filtros {
  eloMin?: Elo;
  eloMax?: Elo;
  complementar?: boolean;
  turno?: Turno;
  estilo?: Estilo;
  genero?: Exclude<Genero, 'nao_informar'>;
}

function valido<T extends string>(lista: readonly { valor: T }[], v: string | null): T | undefined {
  return lista.find((o) => o.valor === v)?.valor;
}

/** Filtros aplicados vivem na URL: sobrevivem ao recarregar e ao voltar do perfil. */
export function lerFiltros(p: URLSearchParams): Filtros {
  return {
    eloMin: valido(ELOS, p.get('eloMin')),
    eloMax: valido(ELOS, p.get('eloMax')),
    complementar: p.get('complementar') === '1' || undefined,
    turno: valido(TURNOS, p.get('turno')),
    estilo: valido(ESTILOS, p.get('estilo')),
    genero: valido(GENEROS_FILTRO, p.get('genero')),
  };
}

export function paraParams(f: Filtros): URLSearchParams {
  const p = new URLSearchParams();
  if (f.eloMin) p.set('eloMin', f.eloMin);
  if (f.eloMax) p.set('eloMax', f.eloMax);
  if (f.complementar) p.set('complementar', '1');
  if (f.turno) p.set('turno', f.turno);
  if (f.estilo) p.set('estilo', f.estilo);
  if (f.genero) p.set('genero', f.genero);
  return p;
}

/** No filtro, "Prefiro não informar" não faz sentido (RN05: só aparece quem declarou e consentiu). */
export const GENEROS_FILTRO = GENEROS.filter(
  (g): g is { valor: Exclude<Genero, 'nao_informar'>; rotulo: string } => g.valor !== 'nao_informar',
);

export function rotulo<T extends string>(lista: readonly { valor: T; rotulo: string }[], v: T | null | undefined) {
  return lista.find((o) => o.valor === v)?.rotulo ?? '';
}

export function iconeFuncao(f: Funcao | null): string | undefined {
  return FUNCOES.find((o) => o.valor === f)?.icone;
}

/** "Noite · Madrugada · Competitivo" */
export function resumoJogo(j: { turnos: Turno[]; estilo: Estilo | null }): string {
  return [...j.turnos.map((t) => rotulo(TURNOS, t)), rotulo(ESTILOS, j.estilo)].filter(Boolean).join(' · ');
}

export const buscarJogadores = (params: URLSearchParams) =>
  api.get<{ jogadores: CardJogador[] }>(`/jogadores?${params.toString()}`);

export const buscarPerfilPublico = (id: string) => api.get<PerfilPublico>(`/jogadores/${encodeURIComponent(id)}`);
