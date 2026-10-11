// RF01: login com Discord (OAuth2, escopo identify). Rotas públicas sob /api/auth.
import { zValidator } from '@hono/zod-validator';
import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import type { AppEnv } from './env';
import { decidirLogin } from './rules';
import { criarSessao, encerrarSessao, tokenAleatorio } from './sessao';

const COOKIE_STATE = 'oauth_state';
const COOKIE_MAIORIDADE = 'oauth_18';
const OPCOES_COOKIE_OAUTH = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  path: '/api/auth',
  maxAge: 600,
} as const;

const discordToken = z.object({ access_token: z.string().min(1).max(512) });

const discordUsuario = z.object({
  id: z.string().regex(/^\d{1,20}$/),
  username: z.string().min(1).max(32),
  global_name: z.string().min(1).max(32).nullish(),
  // Validado porque entra na URL do avatar
  avatar: z
    .string()
    .regex(/^(a_)?[0-9a-f]{32}$/)
    .nullish(),
});

function urlCallback(c: Context<AppEnv>): string {
  return new URL('/api/auth/callback', c.req.url).toString();
}

function limparCookiesOAuth(c: Context<AppEnv>): void {
  deleteCookie(c, COOKIE_STATE, { path: OPCOES_COOKIE_OAUTH.path, secure: true });
  deleteCookie(c, COOKIE_MAIORIDADE, { path: OPCOES_COOKIE_OAUTH.path, secure: true });
}

async function buscarUsuarioDiscord(c: Context<AppEnv>, code: string) {
  const respostaToken = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.env.DISCORD_CLIENT_ID,
      client_secret: c.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: urlCallback(c),
    }),
  });
  if (!respostaToken.ok) return null;
  const token = discordToken.safeParse(await respostaToken.json());
  if (!token.success) return null;

  const respostaUsuario = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token.data.access_token}` },
  });
  if (!respostaUsuario.ok) return null;
  const usuario = discordUsuario.safeParse(await respostaUsuario.json());
  return usuario.success ? usuario.data : null;
}

export const auth = new Hono<AppEnv>();

auth.get(
  '/discord',
  zValidator('query', z.object({ maior18: z.literal('1').optional() }), (r, c) => {
    if (!r.success) return c.redirect('/?erro=falha');
  }),
  (c) => {
    const state = tokenAleatorio();
    setCookie(c, COOKIE_STATE, state, OPCOES_COOKIE_OAUTH);
    if (c.req.valid('query').maior18) {
      setCookie(c, COOKIE_MAIORIDADE, '1', OPCOES_COOKIE_OAUTH);
    } else {
      deleteCookie(c, COOKIE_MAIORIDADE, { path: OPCOES_COOKIE_OAUTH.path, secure: true });
    }

    const url = new URL('https://discord.com/oauth2/authorize');
    url.search = new URLSearchParams({
      response_type: 'code',
      client_id: c.env.DISCORD_CLIENT_ID,
      scope: 'identify',
      state,
      redirect_uri: urlCallback(c),
      prompt: 'none',
    }).toString();
    return c.redirect(url.toString());
  },
);

auth.get(
  '/callback',
  zValidator(
    'query',
    z.object({
      code: z.string().min(1).max(512).optional(),
      state: z.string().min(1).max(128).optional(),
      error: z.string().max(128).optional(),
    }),
    (r, c) => {
      if (!r.success) return c.redirect('/?erro=falha');
    },
  ),
  async (c) => {
    const { code, state, error } = c.req.valid('query');
    const stateSalvo = getCookie(c, COOKIE_STATE);
    const declarouMaioridade = getCookie(c, COOKIE_MAIORIDADE) === '1';
    limparCookiesOAuth(c);

    if (error) return c.redirect('/?erro=cancelado');
    if (!code || !state || !stateSalvo || state !== stateSalvo) return c.redirect('/?erro=falha');

    const discord = await buscarUsuarioDiscord(c, code);
    if (!discord) return c.redirect('/?erro=falha');

    const existente = await c.env.DB.prepare('SELECT id, banido FROM users WHERE discord_id = ?')
      .bind(discord.id)
      .first<{ id: string; banido: number }>();

    const decisao = decidirLogin({
      existe: existente !== null,
      banido: existente?.banido === 1,
      declarouMaioridade,
    });
    if (decisao === 'suspenso') return c.redirect('/suspensa');
    if (decisao === 'maioridade_pendente') return c.redirect('/?erro=idade');

    const nome = discord.global_name ?? discord.username;
    const avatar = discord.avatar ?? null;
    let userId: string;
    if (existente) {
      userId = existente.id;
      await c.env.DB.prepare('UPDATE users SET discord_username = ?, nome = ?, avatar = ? WHERE id = ?')
        .bind(discord.username, nome, avatar, userId)
        .run();
    } else {
      userId = crypto.randomUUID();
      await c.env.DB.prepare(
        `INSERT INTO users (id, discord_id, discord_username, nome, avatar, maior_idade_em)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      )
        .bind(userId, discord.id, discord.username, nome, avatar)
        .run();
    }

    await criarSessao(c, userId);
    return c.redirect('/jogador');
  },
);

auth.post('/logout', async (c) => {
  await encerrarSessao(c);
  return c.body(null, 204);
});
