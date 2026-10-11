// Equipe de moderação (só admin): admins vêm da configuração; moderadores são geridos aqui.
import { api } from './api';

export interface MembroEquipe {
  id: string;
  nome: string;
  discordUsername: string;
  avatarUrl: string | null;
}

export interface RegistroModeracao {
  id: string;
  acao: 'promover_moderador' | 'remover_moderador' | 'banir' | 'desbanir' | 'arquivar_denuncia';
  motivo: string | null;
  data: string;
  autor: string | null;
  alvo: string | null;
}

export interface DadosEquipe {
  admins: MembroEquipe[];
  adminsSemConta: number;
  moderadores: (MembroEquipe & { banido: boolean })[];
  historico: RegistroModeracao[];
}

/** Texto antes e depois do nome do alvo: "leuzin [promoveu] LunaVela [a moderador]" */
export const TEXTO_ACAO: Record<RegistroModeracao['acao'], [string, string]> = {
  promover_moderador: ['promoveu', 'a moderador'],
  remover_moderador: ['removeu', 'da moderação'],
  banir: ['baniu', ''],
  desbanir: ['removeu o banimento de', ''],
  arquivar_denuncia: ['arquivou uma denúncia contra', ''],
};

export const buscarEquipe = () => api.get<DadosEquipe>('/equipe');
export const buscarCandidatos = (q: string) =>
  api.get<{ candidatos: MembroEquipe[] }>(`/equipe/candidatos?${new URLSearchParams({ q }).toString()}`);
export const promoverModerador = (userId: string, motivo: string) =>
  api.post<null>('/equipe/moderadores', { userId, motivo });
export const removerModerador = (userId: string, motivo: string) =>
  api.post<null>(`/equipe/moderadores/${encodeURIComponent(userId)}/remover`, { motivo });
