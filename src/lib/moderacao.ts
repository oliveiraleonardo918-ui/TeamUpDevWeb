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

/** Evidência anexada (a imagem em si vem de urlEvidencia; só a equipe acessa). */
export interface Evidencia {
  id: string;
  tipo: string;
  tamanho: number;
}

export const EVIDENCIAS_MAX = 3;
export const EVIDENCIA_MAX_BYTES = 1024 * 1024;
export const TIPOS_EVIDENCIA = ['image/png', 'image/jpeg', 'image/webp'];
export const urlEvidencia = (id: string) => `/api/moderacao/evidencias/${encodeURIComponent(id)}`;

export interface Denuncia {
  id: string;
  motivo: Motivo;
  descricao: string | null;
  data: string;
  denunciante: { id: string; nome: string };
  denunciado: { id: string; nome: string; avatarUrl: string | null; papel: 'jogador' | 'moderador' | 'admin' };
  evidencias: Evidencia[];
}

export interface PainelModeracao {
  resumo: { abertas: number; arquivadasHoje: number; contasSuspensas: number };
  denuncias: Denuncia[];
}

export interface UsuarioBanido {
  id: string;
  nome: string;
  discordUsername: string;
  avatarUrl: string | null;
  motivo: string | null;
  banidoEm: string | null;
  banidoPor: string | null;
  denuncias: (Omit<Denuncia, 'denunciado'>)[];
}

export const MENSAGENS_DENUNCIA: Record<string, string> = {
  denuncia_existente: 'Você já tem uma denúncia aberta contra essa pessoa. A equipe vai analisar.',
  limite_denuncias: 'Você atingiu o limite de denúncias por hoje. Tente de novo amanhã.',
  muitas_evidencias: 'Envie no máximo 3 imagens.',
  evidencia_grande: 'Cada imagem pode ter no máximo 1 MB.',
  evidencia_tipo: 'Envie só imagens PNG, JPG ou WebP.',
};

export function denunciar(denunciadoId: string, motivo: Motivo, descricao: string, evidencias: File[]) {
  const form = new FormData();
  form.set('denunciadoId', denunciadoId);
  form.set('motivo', motivo);
  form.set('descricao', descricao);
  for (const arquivo of evidencias) form.append('evidencias', arquivo);
  return api.postForm<null>('/denuncias', form);
}

export const buscarPainel = () => api.get<PainelModeracao>('/moderacao');
export const buscarBanidos = () => api.get<{ banidos: UsuarioBanido[] }>('/moderacao/banidos');
export const arquivarDenuncia = (id: string) => api.post<null>(`/moderacao/denuncias/${encodeURIComponent(id)}/arquivar`, {});
export const banir = (userId: string, motivo: string, denunciaId?: string) =>
  api.post<null>(`/moderacao/usuarios/${encodeURIComponent(userId)}/banir`, { motivo, denunciaId });
export const desbanir = (userId: string, motivo: string) =>
  api.post<null>(`/moderacao/usuarios/${encodeURIComponent(userId)}/desbanir`, { motivo });
