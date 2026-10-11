// Sessão: token aleatório no cookie HttpOnly; no banco fica só o SHA-256 dele.
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { AppEnv } from './env';
import { listaAdmins, papelEfetivo } from './rules';

const COOKIE_SESSAO = 'sessao';
const DURACAO_SESSAO_S = 60 * 60 * 24 * 30; // 30 dias

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** 32 bytes de crypto.getRandomValues em base64url (43 caracteres). */
export function tokenAleatorio(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function sha256(texto: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Mesmo formato do datetime('now') do SQLite, para comparar como texto. */
function dataSql(data: Date): string {
  return data.toISOString().replace('T', ' ').slice(0, 19);
}

export async function criarSessao(c: Context<AppEnv>, userId: string): Promise<void> {
  const token = tokenAleatorio();
  const expiraEm = dataSql(new Date(Date.now() + DURACAO_SESSAO_S * 1000));
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND expira_em <= datetime('now')").bind(userId),
    c.env.DB.prepare('INSERT INTO sessions (id, user_id, expira_em) VALUES (?, ?, ?)').bind(
      await sha256(token),
      userId,
      expiraEm,
    ),
  ]);
  setCookie(c, COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: DURACAO_SESSAO_S,
  });
}

function apagarCookieSessao(c: Context<AppEnv>): void {
  deleteCookie(c, COOKIE_SESSAO, { path: '/', secure: true });
}

export async function encerrarSessao(c: Context<AppEnv>): Promise<void> {
  const token = getCookie(c, COOKIE_SESSAO);
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(await sha256(token)).run();
  }
  apagarCookieSessao(c);
}

interface LinhaSessao {
  id: string;
  discord_id: string;
  nome: string;
  discord_username: string;
  avatar: string | null;
  papel: string;
  banido: number;
}

/** Exige sessão válida e põe o usuário em c.var.usuario. RN07: banido perde as sessões. */
export const exigirSessao = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, COOKIE_SESSAO);
  if (!token || token.length > 64) {
    return c.json({ error: 'nao_autenticado' }, 401);
  }

  const linha = await c.env.DB.prepare(
    `SELECT u.id, u.discord_id, u.nome, u.discord_username, u.avatar, u.papel, u.banido
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expira_em > datetime('now')`,
  )
    .bind(await sha256(token))
    .first<LinhaSessao>();

  if (!linha) {
    apagarCookieSessao(c);
    return c.json({ error: 'nao_autenticado' }, 401);
  }
  if (linha.banido) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(linha.id).run();
    apagarCookieSessao(c);
    return c.json({ error: 'conta_suspensa' }, 403);
  }

  c.set('usuario', {
    id: linha.id,
    discordId: linha.discord_id,
    nome: linha.nome,
    discordUsername: linha.discord_username,
    avatar: linha.avatar,
    papel: papelEfetivo(linha.discord_id, linha.papel, listaAdmins(c.env.ADMIN_DISCORD_IDS)),
  });
  await next();
});
