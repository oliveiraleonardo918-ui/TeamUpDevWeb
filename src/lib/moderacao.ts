// Denúncias (RF11) e painel da equipe (RF12, RN07).
import { api } from './api';

export const MOTIVOS = [
  { valor: 'toxicidade', rotulo: 'Toxicidade' },
  { valor: 'assedio', rotulo: 'Assédio' },
  { valor: 'afk', rotulo: 'AFK ou abandono' },
  { valor: 'perfil_falso', rotulo: 'Perfil falso' },
  { valor: 'outro', rotulo: 'Outro' },
] as const;
export type Motivo = (typeof MOTIVOS)[number]['valor'];

export function rotuloMotivo(m: string): string {
  return MOTIVOS.find((o) => o.valor === m)?.rotulo ?? m;
}

export interface Denuncia {
  id: string;
  motivo: Motivo;
  descricao: string | null;
  data: string;
  denunciante: { id: string; nome: string };
  denunciado: { id: string; nome: string; avatarUrl: string | null; papel: 'jogador' | 'moderador' | 'admin' };
}

export interface PainelModeracao {
  resumo: { abertas: number; arquivadasHoje: number; contasSuspensas: number };
  denuncias: Denuncia[];
  banidos: { id: string; nome: string; discordUsername: string; avatarUrl: string | null; motivo: string | null }[];
}

export const MENSAGENS_DENUNCIA: Record<string, string> = {
  denuncia_existente: 'Você já tem uma denúncia aberta contra essa pessoa. A equipe vai analisar.',
  limite_denuncias: 'Você atingiu o limite de denúncias por hoje. Tente de novo amanhã.',
};

export const denunciar = (denunciadoId: string, motivo: Motivo, descricao: string) =>
  api.post<null>('/denuncias', { denunciadoId, motivo, descricao });

export const buscarPainel = () => api.get<PainelModeracao>('/moderacao');
export const arquivarDenuncia = (id: string) => api.post<null>(`/moderacao/denuncias/${encodeURIComponent(id)}/arquivar`, {});
export const banir = (userId: string, motivo: string, denunciaId?: string) =>
  api.post<null>(`/moderacao/usuarios/${encodeURIComponent(userId)}/banir`, { motivo, denunciaId });
export const desbanir = (userId: string, motivo: string) =>
  api.post<null>(`/moderacao/usuarios/${encodeURIComponent(userId)}/desbanir`, { motivo });
