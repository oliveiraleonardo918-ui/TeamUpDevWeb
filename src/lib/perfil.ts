// Perfil gamer: tipos, rótulos das opções e chamadas da API (RF02-RF04).
import iconeControlador from '../assets/icons/cloud.svg';
import iconeIniciador from '../assets/icons/radar.svg';
import iconeSentinela from '../assets/icons/shield.svg';
import iconeDuelista from '../assets/icons/zap.svg';
import type { Opcao } from '../components/Opcoes';
import { api } from './api';

export const ETAPAS = ['jogos', 'nivel', 'horarios', 'estilo'] as const;
export type Etapa = (typeof ETAPAS)[number];

export type Elo = 'ferro' | 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante' | 'ascendente' | 'imortal' | 'radiante';
export type Funcao = 'duelista' | 'iniciador' | 'controlador' | 'sentinela';
export type Turno = 'manha' | 'tarde' | 'noite' | 'madrugada';
export type Estilo = 'casual' | 'competitivo';
export type Genero = 'mulher' | 'homem' | 'nao_binario' | 'nao_informar';

export interface Perfil {
  riotId: string | null;
  elo: Elo | null;
  funcaoPrimaria: Funcao | null;
  funcaoSecundaria: Funcao | null;
  turnos: Turno[];
  disponivel: boolean;
  estilo: Estilo | null;
  bio: string | null;
  genero: Genero | null;
  generoVisivel: boolean;
}

export interface RespostaPerfil {
  id: string;
  nome: string;
  avatarUrl: string | null;
  perfil: Perfil;
  etapas: Record<Etapa, boolean>;
  proximaEtapa: Etapa | null;
  buscaLiberada: boolean;
}

export const NOMES_ETAPAS: Record<Etapa, string> = {
  jogos: 'Jogos e Contas',
  nivel: 'Nível',
  horarios: 'Horários',
  estilo: 'Estilo de Jogo',
};

export const ELOS: Opcao<Elo>[] = [
  { valor: 'ferro', rotulo: 'Ferro' },
  { valor: 'bronze', rotulo: 'Bronze' },
  { valor: 'prata', rotulo: 'Prata' },
  { valor: 'ouro', rotulo: 'Ouro' },
  { valor: 'platina', rotulo: 'Platina' },
  { valor: 'diamante', rotulo: 'Diamante' },
  { valor: 'ascendente', rotulo: 'Ascendente' },
  { valor: 'imortal', rotulo: 'Imortal' },
  { valor: 'radiante', rotulo: 'Radiante' },
];

export const FUNCOES: Opcao<Funcao>[] = [
  { valor: 'duelista', rotulo: 'Duelista', icone: iconeDuelista },
  { valor: 'iniciador', rotulo: 'Iniciador', icone: iconeIniciador },
  { valor: 'controlador', rotulo: 'Controlador', icone: iconeControlador },
  { valor: 'sentinela', rotulo: 'Sentinela', icone: iconeSentinela },
];

export const TURNOS: Opcao<Turno>[] = [
  { valor: 'manha', rotulo: 'Manhã' },
  { valor: 'tarde', rotulo: 'Tarde' },
  { valor: 'noite', rotulo: 'Noite' },
  { valor: 'madrugada', rotulo: 'Madrugada' },
];

export const ESTILOS: Opcao<Estilo>[] = [
  { valor: 'casual', rotulo: 'Casual' },
  { valor: 'competitivo', rotulo: 'Competitivo' },
];

export const GENEROS: Opcao<Genero>[] = [
  { valor: 'mulher', rotulo: 'Mulher' },
  { valor: 'homem', rotulo: 'Homem' },
  { valor: 'nao_binario', rotulo: 'Não binário' },
  { valor: 'nao_informar', rotulo: 'Prefiro não informar' },
];

export const buscarPerfil = () => api.get<RespostaPerfil>('/perfil');

export const salvarEtapa = {
  jogos: (d: { riotId: string }) => api.put<null>('/perfil/jogos', d),
  nivel: (d: { elo: Elo; funcaoPrimaria: Funcao; funcaoSecundaria: Funcao }) => api.put<null>('/perfil/nivel', d),
  horarios: (d: { turnos: Turno[]; disponivel: boolean }) => api.put<null>('/perfil/horarios', d),
  estilo: (d: { estilo: Estilo; bio: string; genero: Genero | null; generoVisivel: boolean }) =>
    api.put<null>('/perfil/estilo', d),
};
