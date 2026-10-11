import { describe, expect, it } from 'vitest';
import { avatarUrl } from './util';

describe('Foto de perfil do Discord', () => {
  const hash = 'a'.repeat(32);
  it('monta a URL do CDN do Discord', () =>
    expect(avatarUrl('324755887363194893', hash)).toBe(
      `https://cdn.discordapp.com/avatars/324755887363194893/${hash}.png?size=128`,
    ));
  it('aceita avatar animado (prefixo a_), servido como PNG estático', () =>
    expect(avatarUrl('42', `a_${hash}`)).toContain(`/a_${hash}.png`));
  it('sem foto ou conta excluída, null', () => {
    expect(avatarUrl('42', null)).toBeNull();
    expect(avatarUrl('excluido-00000000-0000-4000-8000-000000000001', hash)).toBeNull();
  });
  it('recusa valores que poderiam mudar a URL', () => {
    expect(avatarUrl('42', '../../evil')).toBeNull();
    expect(avatarUrl('42/../x', hash)).toBeNull();
  });
});
