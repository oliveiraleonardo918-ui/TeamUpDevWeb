import { describe, expect, it } from 'vitest';
import { funcaoComplementar, notaValida, perfilCompleto } from './rules';

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
