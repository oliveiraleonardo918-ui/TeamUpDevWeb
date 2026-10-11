import { describe, expect, it } from 'vitest';
import {
  decidirLogin,
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
