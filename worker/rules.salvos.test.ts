import { describe, expect, it } from 'vitest';
import { MAX_SALVOS, podeSalvar } from './rules';

const base = { euId: 'eu', alvoId: 'outro', jaSalvo: false, totalSalvos: 0 };

describe('RN10 - jogadores salvos', () => {
  it('permite salvar outro jogador', () => {
    expect(podeSalvar(base)).toBeNull();
  });
  it('não deixa salvar a si mesmo', () => {
    expect(podeSalvar({ ...base, alvoId: 'eu' })).toBe('proprio_usuario');
  });
  it('não deixa salvar duas vezes', () => {
    expect(podeSalvar({ ...base, jaSalvo: true })).toBe('ja_salvo');
  });
  it('permite chegar ao limite', () => {
    expect(podeSalvar({ ...base, totalSalvos: MAX_SALVOS - 1 })).toBeNull();
  });
  it('bloqueia depois do limite', () => {
    expect(podeSalvar({ ...base, totalSalvos: MAX_SALVOS })).toBe('limite_salvos');
  });
});