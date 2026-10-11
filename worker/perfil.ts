// RF02-RF04: perfil gamer do próprio usuário (a rota exige sessão; só lê/altera o próprio perfil).
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from './env';
import { ELOS, etapasConcluidas, funcoesValidas, generoParaSalvar, perfilCompleto, proximaEtapa, riotIdValido } from './rules';
import { avatarUrl, entradaInvalida } from './util';

const FUNCOES = ['duelista', 'iniciador', 'controlador', 'sentinela'] as const;
const TURNOS = ['manha', 'tarde', 'noite', 'madrugada'] as const;
const ESTILOS = ['casual', 'competitivo'] as const;
const GENEROS = ['mulher', 'homem', 'nao_binario', 'nao_informar'] as const;

const turnosSchema = z.array(z.enum(TURNOS)).max(TURNOS.length);

const schemas = {
  jogos: z.object({
    riotId: z.string().trim().max(22).refine(riotIdValido, 'riot_id_invalido'),
  }),
  nivel: z
    .object({
      elo: z.enum(ELOS),
      funcaoPrimaria: z.enum(FUNCOES),
      funcaoSecundaria: z.enum(FUNCOES),
    })
    .refine((d) => funcoesValidas(d.funcaoPrimaria, d.funcaoSecundaria), 'funcoes_iguais'),
  horarios: z.object({
    turnos: turnosSchema.min(1),
    disponivel: z.boolean(),
  }),
  estilo: z.object({
    estilo: z.enum(ESTILOS),
    bio: z.string().trim().max(160),
    genero: z.enum(GENEROS).nullable(),
    generoVisivel: z.boolean(),
  }),
};

interface LinhaPerfil {
  riot_id: string | null;
  elo: string | null;
  funcao_primaria: string | null;
  funcao_secundaria: string | null;
  turnos: string | null;
  disponivel: number;
  estilo: string | null;
  genero: string | null;
  genero_visivel: number;
  bio: string | null;
}

function lerTurnos(json: string | null): string[] {
  if (!json) return [];
  try {
    const r = turnosSchema.safeParse(JSON.parse(json));
    return r.success ? r.data : [];
  } catch {
    return [];
  }
}


export const perfil = new Hono<AppEnv>();

perfil.get('/', async (c) => {
  const u = c.var.usuario;
  const linha = await c.env.DB.prepare(
    `SELECT riot_id, elo, funcao_primaria, funcao_secundaria, turnos, disponivel,
            estilo, genero, genero_visivel, bio
       FROM profiles WHERE user_id = ?`,
  )
    .bind(u.id)
    .first<LinhaPerfil>();

  const dados = {
    riotId: linha?.riot_id ?? null,
    elo: linha?.elo ?? null,
    funcaoPrimaria: linha?.funcao_primaria ?? null,
    funcaoSecundaria: linha?.funcao_secundaria ?? null,
    turnos: lerTurnos(linha?.turnos ?? null),
    disponivel: linha?.disponivel === 1,
    estilo: linha?.estilo ?? null,
    bio: linha?.bio ?? null,
    genero: linha?.genero ?? null,
    generoVisivel: linha?.genero_visivel === 1,
  };

  return c.json({
    id: u.id,
    nome: u.nome,
    avatarUrl: avatarUrl(u.discordId, u.avatar),
    perfil: dados,
    etapas: etapasConcluidas(dados),
    proximaEtapa: proximaEtapa(dados),
    buscaLiberada: perfilCompleto(dados), // RN01
  });
});

// Cada etapa grava só os próprios campos (upsert pelo user_id da sessão).

perfil.put('/jogos', zValidator('json', schemas.jogos, entradaInvalida), async (c) => {
  const { riotId } = c.req.valid('json');
  await c.env.DB.prepare(
    `INSERT INTO profiles (user_id, riot_id) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET riot_id = excluded.riot_id`,
  )
    .bind(c.var.usuario.id, riotId)
    .run();
  return c.body(null, 204);
});

perfil.put('/nivel', zValidator('json', schemas.nivel, entradaInvalida), async (c) => {
  const d = c.req.valid('json');
  await c.env.DB.prepare(
    `INSERT INTO profiles (user_id, elo, funcao_primaria, funcao_secundaria) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       elo = excluded.elo,
       funcao_primaria = excluded.funcao_primaria,
       funcao_secundaria = excluded.funcao_secundaria`,
  )
    .bind(c.var.usuario.id, d.elo, d.funcaoPrimaria, d.funcaoSecundaria)
    .run();
  return c.body(null, 204);
});

perfil.put('/horarios', zValidator('json', schemas.horarios, entradaInvalida), async (c) => {
  const d = c.req.valid('json');
  const turnos = JSON.stringify([...new Set(d.turnos)]);
  await c.env.DB.prepare(
    `INSERT INTO profiles (user_id, turnos, disponivel) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET turnos = excluded.turnos, disponivel = excluded.disponivel`,
  )
    .bind(c.var.usuario.id, turnos, d.disponivel ? 1 : 0)
    .run();
  return c.body(null, 204);
});

perfil.put('/estilo', zValidator('json', schemas.estilo, entradaInvalida), async (c) => {
  const d = c.req.valid('json');
  const g = generoParaSalvar(d.genero, d.generoVisivel);
  await c.env.DB.prepare(
    `INSERT INTO profiles (user_id, estilo, bio, genero, genero_visivel) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       estilo = excluded.estilo,
       bio = excluded.bio,
       genero = excluded.genero,
       genero_visivel = excluded.genero_visivel`,
  )
    .bind(c.var.usuario.id, d.estilo, d.bio || null, g.genero, g.visivel ? 1 : 0)
    .run();
  return c.body(null, 204);
});
