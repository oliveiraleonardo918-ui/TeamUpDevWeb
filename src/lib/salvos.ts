// Jogadores salvos (RF15, RN10): lista privada para ver depois.
import { api } from './api';
import type { CardJogador } from './jogadores';

/** Mesmo limite da regra RN10 no servidor (worker/rules.ts) */
export const MAX_SALVOS = 50;

export const buscarSalvos = () => api.get<{ jogadores: CardJogador[] }>('/salvos');
export const salvarJogador = (id: string) => api.post<null>('/salvos', { jogadorId: id });
export const removerSalvo = (id: string) => api.del<null>(`/salvos/${encodeURIComponent(id)}`);

/** Mensagens para os erros da API (o resto vira uma mensagem genérica) */
export const MENSAGENS_SALVOS: Record<string, string> = {
  limite_salvos: `Você chegou ao limite de ${MAX_SALVOS} jogadores salvos. Remova alguém para salvar outro.`,
  ja_salvo: 'Este jogador já está nos seus salvos.',
};