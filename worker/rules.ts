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

/** RF10: nota de 1 a 5 estrelas, inteira. */
export function notaValida(nota: number): boolean {
  return Number.isInteger(nota) && nota >= 1 && nota <= 5;
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

/** RF02: as 4 etapas do perfil gamer, na ordem do onboarding. */
export const ETAPAS = ['jogos', 'nivel', 'horarios', 'estilo'] as const;
export type Etapa = (typeof ETAPAS)[number];

export interface PerfilEtapas {
  riotId?: string | null;
  elo?: string | null;
  funcaoPrimaria?: string | null;
  funcaoSecundaria?: string | null;
  turnos?: string[] | null;
  estilo?: string | null;
}

/** RF03: quais etapas do checklist estão concluídas. */
export function etapasConcluidas(p: PerfilEtapas): Record<Etapa, boolean> {
  return {
    jogos: Boolean(p.riotId?.trim()),
    nivel: Boolean(p.elo && p.funcaoPrimaria && p.funcaoSecundaria),
    horarios: (p.turnos?.length ?? 0) > 0,
    estilo: Boolean(p.estilo),
  };
}

/** RF03 / US02 cenário 2: "Completar Perfil" leva à primeira etapa pendente (null = tudo pronto). */
export function proximaEtapa(p: PerfilEtapas): Etapa | null {
  const feitas = etapasConcluidas(p);
  return ETAPAS.find((e) => !feitas[e]) ?? null;
}

/** Riot ID no formato Nome#TAG: nome de 3 a 16 caracteres, tag de 3 a 5 letras ou números. */
export function riotIdValido(riotId: string): boolean {
  return /^[^#]{3,16}#[A-Za-z0-9]{3,5}$/u.test(riotId.trim());
}

/** RF04: a função secundária precisa ser diferente da primária. */
export function funcoesValidas(primaria: Role, secundaria: Role): boolean {
  return primaria !== secundaria;
}

/** RN05: sem gênero declarado não há o que exibir, então o consentimento é descartado. */
export function generoParaSalvar(
  genero: string | null,
  visivel: boolean,
): { genero: string | null; visivel: boolean } {
  if (!genero || genero === 'nao_informar') return { genero: null, visivel: false };
  return { genero, visivel };
}

/** Elos em ordem crescente. */
export const ELOS = ['ferro', 'bronze', 'prata', 'ouro', 'platina', 'diamante', 'ascendente', 'imortal', 'radiante'] as const;
export type Elo = (typeof ELOS)[number];

/** RF05: elos dentro da faixa escolhida (inclusiva; aceita mínimo e máximo invertidos). */
export function faixaElo(min: Elo = 'ferro', max: Elo = 'radiante'): Elo[] {
  const [a, b] = [ELOS.indexOf(min), ELOS.indexOf(max)].sort((x, y) => x - y);
  return ELOS.slice(a, b + 1);
}

/** Exibição: a nota pública só aparece a partir de 3 avaliações (antes disso, "Novo jogador"). */
export function notaPublica(media: number | null, total: number): number | null {
  if (total < 3 || media === null) return null;
  return Math.round(media * 10) / 10;
}

export interface PerfilCompatibilidade {
  elo?: string | null;
  funcaoPrimaria?: string | null;
  turnos?: string[] | null;
  estilo?: string | null;
}

/**
 * "Mais compatíveis primeiro": turnos em comum pesam mais, depois função complementar,
 * elo próximo e mesmo estilo de jogo.
 */
export function compatibilidade(eu: PerfilCompatibilidade, outro: PerfilCompatibilidade): number {
  let pontos = 0;
  const meus = new Set(eu.turnos ?? []);
  pontos += (outro.turnos ?? []).filter((t) => meus.has(t)).length * 3;
  if (eu.funcaoPrimaria && outro.funcaoPrimaria && eu.funcaoPrimaria !== outro.funcaoPrimaria) pontos += 2;
  const [a, b] = [ELOS.indexOf(eu.elo as Elo), ELOS.indexOf(outro.elo as Elo)];
  if (a >= 0 && b >= 0) pontos += Math.max(0, 2 - Math.abs(a - b));
  if (eu.estilo && eu.estilo === outro.estilo) pontos += 1;
  return pontos;
}

/** Máximo de convites pendentes enviados ao mesmo tempo (evita spam). */
export const MAX_CONVITES_PENDENTES = 20;

/** Depois de uma recusa, quem convidou espera este tempo para convidar a mesma pessoa de novo. */
export const DIAS_APOS_RECUSA = 7;

export type MotivoConviteBloqueado =
  | 'proprio_usuario'
  | 'perfil_incompleto'
  | 'convite_existente'
  | 'convite_recebido'
  | 'ja_tem_match'
  | 'convite_recusado'
  | 'limite_convites';

/**
 * RF07: pode enviar convite? `entrePar` é o convite mais relevante já existente entre os dois
 * (pendente ou aceito), com a direção vista por quem convida.
 */
export function podeConvidar(p: {
  euId: string;
  alvoId: string;
  meuPerfilCompleto: boolean;
  entrePar: { status: 'pendente' | 'aceito'; enviadoPorMim: boolean } | null;
  pendentesEnviados: number;
  /** Esta pessoa recusou um convite meu nos últimos DIAS_APOS_RECUSA dias (evita insistência) */
  recusouRecentemente: boolean;
}): MotivoConviteBloqueado | null {
  if (p.euId === p.alvoId) return 'proprio_usuario';
  if (!p.meuPerfilCompleto) return 'perfil_incompleto';
  if (p.entrePar?.status === 'aceito') return 'ja_tem_match';
  if (p.entrePar?.status === 'pendente') return p.entrePar.enviadoPorMim ? 'convite_existente' : 'convite_recebido';
  if (p.recusouRecentemente) return 'convite_recusado';
  if (p.pendentesEnviados >= MAX_CONVITES_PENDENTES) return 'limite_convites';
  return null;
}

export const COMENTARIO_MAX = 280;

/** RN04: só avalia quem participou de um match aceito, uma vez por match. */
export function podeAvaliar(p: {
  participante: boolean;
  matchAceito: boolean;
  jaAvaliou: boolean;
}): 'nao_encontrado' | 'ja_avaliado' | null {
  if (!p.participante || !p.matchAceito) return 'nao_encontrado';
  if (p.jaAvaliou) return 'ja_avaliado';
  return null;
}

export type Papel = 'jogador' | 'moderador' | 'admin';

/** IDs do Discord da variável ADMIN_DISCORD_IDS ("123,456"), ignorando espaços e itens vazios. */
export function listaAdmins(config: string | undefined): Set<string> {
  return new Set((config ?? '').split(',').map((s) => s.trim()).filter((s) => /^\d{1,20}$/.test(s)));
}

/** Admin vem só da configuração; o banco guarda no máximo "moderador". */
export function papelEfetivo(discordId: string, papelNoBanco: string, admins: Set<string>): Papel {
  if (admins.has(discordId)) return 'admin';
  return papelNoBanco === 'moderador' ? 'moderador' : 'jogador';
}

/** RF12: ver denúncias, arquivar e banir. */
export function podeModerar(papel: Papel): boolean {
  return papel === 'moderador' || papel === 'admin';
}

/** Promover e remover moderadores: só admin, e só sobre outra pessoa com o papel certo. */
export function podeMudarModerador(p: {
  ator: { id: string; papel: Papel };
  alvo: { id: string; papel: Papel; banido: boolean };
  acao: 'promover' | 'remover';
}): 'sem_permissao' | 'proprio_usuario' | 'papel_invalido' | null {
  if (p.ator.papel !== 'admin') return 'sem_permissao';
  if (p.ator.id === p.alvo.id) return 'proprio_usuario';
  if (p.acao === 'promover' && (p.alvo.papel !== 'jogador' || p.alvo.banido)) return 'papel_invalido';
  if (p.acao === 'remover' && p.alvo.papel !== 'moderador') return 'papel_invalido';
  return null;
}

export const MOTIVOS_DENUNCIA = ['toxicidade', 'assedio', 'afk', 'perfil_falso', 'outro'] as const;
export const MAX_DENUNCIAS_POR_DIA = 10;

/** RF11: pode denunciar? */
export function podeDenunciar(p: {
  euId: string;
  alvoId: string;
  jaTemAbertaContraAlvo: boolean;
  denunciasHoje: number;
}): 'proprio_usuario' | 'denuncia_existente' | 'limite_denuncias' | null {
  if (p.euId === p.alvoId) return 'proprio_usuario';
  if (p.jaTemAbertaContraAlvo) return 'denuncia_existente';
  if (p.denunciasHoje >= MAX_DENUNCIAS_POR_DIA) return 'limite_denuncias';
  return null;
}

/**
 * RF12 + RN07: banir. Moderador bane só jogador; admin bane jogador ou moderador.
 * Admin nunca é banido pela interface, e ninguém bane a si mesmo.
 */
export function podeBanir(
  ator: { id: string; papel: Papel },
  alvo: { id: string; papel: Papel; banido: boolean },
): 'sem_permissao' | 'proprio_usuario' | 'alvo_protegido' | 'ja_banido' | null {
  if (!podeModerar(ator.papel)) return 'sem_permissao';
  if (ator.id === alvo.id) return 'proprio_usuario';
  if (alvo.papel === 'admin') return 'alvo_protegido';
  if (alvo.papel === 'moderador' && ator.papel !== 'admin') return 'alvo_protegido';
  if (alvo.banido) return 'ja_banido';
  return null;
}

/** Remover banimento (revisão): só admin. */
export function podeDesbanir(ator: { papel: Papel }, alvo: { banido: boolean }): 'sem_permissao' | 'nao_banido' | null {
  if (ator.papel !== 'admin') return 'sem_permissao';
  if (!alvo.banido) return 'nao_banido';
  return null;
}

export const NOME_CONTA_EXCLUIDA = 'Conta excluída';
export const CONFIRMACAO_EXCLUSAO = 'EXCLUIR';

/**
 * RNF09: o que sobra de uma conta excluída. Nada identifica a pessoa: o discord_id vira um valor
 * derivado do id interno (precisa continuar único), nome e usuário somem.
 */
export function dadosAnonimizados(userId: string) {
  return {
    discordId: `excluido-${userId}`,
    discordUsername: '',
    nome: NOME_CONTA_EXCLUIDA,
  };
}
