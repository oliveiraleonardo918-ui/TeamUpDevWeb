import { describe, expect, it } from 'vitest';
import { decidirLogin, funcaoComplementar, notaValida, perfilCompleto, rotaPublica } from './rules';

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
