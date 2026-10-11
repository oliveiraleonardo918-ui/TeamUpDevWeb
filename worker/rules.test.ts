import { describe, expect, it } from 'vitest';
import {
  compatibilidade,
  MAX_CONVITES_PENDENTES,
  podeConvidar,
  decidirLogin,
  faixaElo,
  notaPublica,
  etapasConcluidas,
  funcaoComplementar,
  funcoesValidas,
  generoParaSalvar,
  notaValida,
  perfilCompleto,
  proximaEtapa,
  riotIdValido,
  rotaPublica,
} from './rules';

describe('RN01 - perfil mínimo', () => {
  it('bloqueia perfil sem Riot ID', () => {
    expect(perfilCompleto({ riotId: '', turnos: ['noite'] })).toBe(false);
  });
  it('bloqueia perfil sem turno', () => {
    expect(perfilCompleto({ riotId: 'Marina#BR1', turnos: [] })).toBe(false);
  });
  it('libera perfil com Riot ID e turno', () => {
    expect(perfilCompleto({ riotId: 'Marina#BR1', turnos: ['noite'] })).toBe(true);
  });
});

describe('RN03 - função complementar', () => {
  it('não pareia a mesma função primária', () => {
    expect(funcaoComplementar('duelista', 'duelista')).toBe(false);
    expect(funcaoComplementar('duelista', 'controlador')).toBe(true);
  });
});

describe('RF10 - nota da avaliação', () => {
  it.each([0, 3, 5])('aceita %i', (n) => expect(notaValida(n)).toBe(true));
  it.each([-1, 6, 4.5])('rejeita %s', (n) => expect(notaValida(n)).toBe(false));
});

describe('RNF04 - rotas públicas', () => {
  it.each(['/api/health', '/api/auth/discord', '/api/auth/callback', '/api/auth/logout'])('%s é pública', (p) =>
    expect(rotaPublica(p)).toBe(true),
  );
  it.each(['/api/me', '/api/healthz', '/api/auth', '/api/authx/discord', '/api/perfis'])('%s exige sessão', (p) =>
    expect(rotaPublica(p)).toBe(false),
  );
});

describe('RN06 e RN07 - login', () => {
  it('banido não entra, mesmo declarando maioridade', () => {
    expect(decidirLogin({ existe: true, banido: true, declarouMaioridade: true })).toBe('suspenso');
  });
  it('usuário existente entra', () => {
    expect(decidirLogin({ existe: true, banido: false, declarouMaioridade: false })).toBe('entrar');
  });
  it('conta nova exige a declaração de 18+', () => {
    expect(decidirLogin({ existe: false, banido: false, declarouMaioridade: false })).toBe('maioridade_pendente');
  });
  it('conta nova com declaração é criada', () => {
    expect(decidirLogin({ existe: false, banido: false, declarouMaioridade: true })).toBe('criar');
  });
});

describe('RF03 - checklist do perfil', () => {
  const completo = {
    riotId: 'Marina#BR1',
    elo: 'ouro',
    funcaoPrimaria: 'controlador',
    funcaoSecundaria: 'sentinela',
    turnos: ['noite'],
    estilo: 'competitivo',
  };

  it('perfil zerado começa pela etapa 1 (US02, cenário 1)', () => {
    expect(proximaEtapa({})).toBe('jogos');
    expect(Object.values(etapasConcluidas({}))).toEqual([false, false, false, false]);
  });
  it('perfil parcial vai direto para a etapa pendente (US02, cenário 2)', () => {
    expect(proximaEtapa({ ...completo, turnos: [], estilo: null })).toBe('horarios');
  });
  it('nível só conta com elo e as duas funções', () => {
    expect(etapasConcluidas({ elo: 'ouro', funcaoPrimaria: 'duelista' }).nivel).toBe(false);
  });
  it('perfil completo não tem próxima etapa', () => {
    expect(proximaEtapa(completo)).toBeNull();
  });
});

describe('RF02 - Riot ID', () => {
  it.each(['Marina#BR1', 'Luna Vela#12345', 'Ção#abc'])('aceita %s', (r) => expect(riotIdValido(r)).toBe(true));
  it.each(['Marina', 'Ma#BR1', 'Marina#B1', 'Marina#BR1234', 'Marina#B-1', 'NomeMuitoGrandeDemais#BR1'])(
    'rejeita %s',
    (r) => expect(riotIdValido(r)).toBe(false),
  );
});

describe('RF04 - funções', () => {
  it('secundária igual à primária é inválida', () => {
    expect(funcoesValidas('duelista', 'duelista')).toBe(false);
    expect(funcoesValidas('duelista', 'sentinela')).toBe(true);
  });
});

describe('RN05 - gênero opcional com consentimento', () => {
  it('sem gênero, o consentimento é descartado', () => {
    expect(generoParaSalvar(null, true)).toEqual({ genero: null, visivel: false });
    expect(generoParaSalvar('nao_informar', true)).toEqual({ genero: null, visivel: false });
  });
  it('gênero declarado respeita a escolha de exibição', () => {
    expect(generoParaSalvar('mulher', true)).toEqual({ genero: 'mulher', visivel: true });
    expect(generoParaSalvar('mulher', false)).toEqual({ genero: 'mulher', visivel: false });
  });
});

describe('RF05 - faixa de elo', () => {
  it('é inclusiva', () => expect(faixaElo('prata', 'platina')).toEqual(['prata', 'ouro', 'platina']));
  it('aceita mínimo e máximo invertidos', () => expect(faixaElo('platina', 'prata')).toEqual(['prata', 'ouro', 'platina']));
  it('sem limites devolve todos', () => expect(faixaElo()).toHaveLength(9));
});

describe('Nota pública a partir de 3 avaliações', () => {
  it('com menos de 3 avaliações é "Novo jogador"', () => {
    expect(notaPublica(5, 2)).toBeNull();
    expect(notaPublica(null, 0)).toBeNull();
  });
  it('arredonda para uma casa', () => expect(notaPublica(4.8333, 6)).toBe(4.8));
});

describe('Compatibilidade', () => {
  const eu = { elo: 'ouro', funcaoPrimaria: 'controlador', turnos: ['noite'], estilo: 'competitivo' };
  it('turno em comum e função complementar vêm primeiro', () => {
    const afinado = { elo: 'ouro', funcaoPrimaria: 'duelista', turnos: ['noite'], estilo: 'competitivo' };
    const distante = { elo: 'radiante', funcaoPrimaria: 'controlador', turnos: ['manha'], estilo: 'casual' };
    expect(compatibilidade(eu, afinado)).toBeGreaterThan(compatibilidade(eu, distante));
  });
  it('perfil sem dados vale zero', () => expect(compatibilidade(eu, {})).toBe(0));
});

describe('RF07 - enviar convite', () => {
  const base = {
    euId: 'a',
    alvoId: 'b',
    meuPerfilCompleto: true,
    entrePar: null,
    pendentesEnviados: 0,
    recusouRecentemente: false,
  };
  it('libera quando não há nada entre os dois', () => expect(podeConvidar(base)).toBeNull());
  it('não convida a si mesmo', () => expect(podeConvidar({ ...base, alvoId: 'a' })).toBe('proprio_usuario'));
  it('exige perfil mínimo (RN01)', () => expect(podeConvidar({ ...base, meuPerfilCompleto: false })).toBe('perfil_incompleto'));
  it('não repete convite pendente', () =>
    expect(podeConvidar({ ...base, entrePar: { status: 'pendente', enviadoPorMim: true } })).toBe('convite_existente'));
  it('avisa quando o outro já me convidou', () =>
    expect(podeConvidar({ ...base, entrePar: { status: 'pendente', enviadoPorMim: false } })).toBe('convite_recebido'));
  it('não convida quem já é match (RN02: o match é único por par)', () =>
    expect(podeConvidar({ ...base, entrePar: { status: 'aceito', enviadoPorMim: false } })).toBe('ja_tem_match'));
  it('espera antes de reconvidar quem recusou', () =>
    expect(podeConvidar({ ...base, recusouRecentemente: true })).toBe('convite_recusado'));
  it('limita convites pendentes', () =>
    expect(podeConvidar({ ...base, pendentesEnviados: MAX_CONVITES_PENDENTES })).toBe('limite_convites'));
});
