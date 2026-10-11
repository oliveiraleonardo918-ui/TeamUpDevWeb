// Convites (RF07, RF08) e matches (RF09).
import { api } from './api';
import type { CardJogador } from './jogadores';
import type { Elo, Funcao } from './perfil';

export interface Convite {
  id: string;
  status: 'pendente' | 'aceito' | 'recusado';
  data: string;
  respondidoEm: string | null;
  jogador: CardJogador;
}

export interface ItemMatch {
  id: string;
  data: string;
  jogador: { id: string; nome: string; elo: Elo | null; funcaoPrimaria: Funcao | null };
  minhaAvaliacao: { nota: number; data: string } | null;
}

export interface DetalheMatch {
  id: string;
  data: string;
  eu: { id: string; nome: string };
  parceiro: {
    id: string;
    nome: string;
    riotId: string | null;
    discordUsername: string;
    discordUrl: string;
    /** nota null = menos de 3 avaliações */
    reputacao: { nota: number | null; total: number };
  };
  minhaAvaliacao: { nota: number; comentario: string | null; data: string } | null;
}

export const COMENTARIO_MAX = 280;

/** Rótulo de cada nota na tela de avaliação. */
export const ROTULOS_NOTA = ['', 'Não foi uma boa parceria', 'Parceria difícil', 'Parceria ok', 'Boa parceria', 'Excelente parceria'];

export const buscarConvites = () => api.get<{ recebidos: Convite[]; enviados: Convite[] }>('/convites');
export const enviarConvite = (para: string) => api.post<{ id: string }>('/convites', { para });
export const aceitarConvite = (id: string) => api.post<{ matchId: string }>(`/convites/${encodeURIComponent(id)}/aceitar`);
export const recusarConvite = (id: string) => api.post<null>(`/convites/${encodeURIComponent(id)}/recusar`);

export const buscarMatches = () => api.get<{ matches: ItemMatch[] }>('/matches');
export const buscarMatch = (id: string) => api.get<DetalheMatch>(`/matches/${encodeURIComponent(id)}`);
export const avaliarMatch = (id: string, nota: number, comentario: string) =>
  api.post<{ reputacao: { nota: number | null; total: number } }>(`/matches/${encodeURIComponent(id)}/avaliacao`, {
    nota,
    comentario,
  });

/** Mensagens para os bloqueios de convite (códigos do servidor, worker/rules.ts podeConvidar). */
export const MENSAGENS_CONVITE: Record<string, string> = {
  perfil_incompleto: 'Complete seu perfil mínimo (Riot ID e 1 horário) para convidar.',
  convite_existente: 'Você já enviou um convite para essa pessoa.',
  convite_recebido: 'Essa pessoa já te convidou. Responda na sua caixa de convites.',
  ja_tem_match: 'Vocês já formaram um duo.',
  convite_recusado: 'Essa pessoa recusou um convite seu há pouco tempo. Tente de novo em alguns dias.',
  limite_convites: 'Você tem muitos convites aguardando resposta. Espere algumas respostas antes de enviar mais.',
};
