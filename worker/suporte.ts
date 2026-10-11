// Formulário de suporte: a mensagem é guardada no D1 e enviada por e-mail ao suporte (Resend), sem o usuário
// sair do site. Rota pública (quem está banido também pede revisão), com limites anti-spam.
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from './env';
import { podeEnviarSuporte } from './rules';
import { usuarioOpcional } from './sessao';
import { entradaInvalida } from './util';

const EMAIL_SUPORTE = 'suporteteamup@gmail.com';
// Sem domínio próprio, o Resend envia pelo domínio de testes dele, só para o e-mail dono da conta (o do suporte)
const REMETENTE = 'TeamUp <onboarding@resend.dev>';

const schema = z.object({
  email: z.string().trim().max(254).email(),
  assunto: z.string().trim().min(3).max(120),
  mensagem: z.string().trim().min(10).max(2000),
  // Campo-armadilha: invisível para pessoas; robô que preenche é descartado em silêncio
  site: z.string().max(200).optional(),
});

async function sha256(texto: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Tira quebras de linha do assunto (o texto vai num cabeçalho de e-mail). */
function linhaUnica(texto: string): string {
  return texto.replace(/[\r\n]+/g, ' ').trim();
}

export const suporte = new Hono<AppEnv>();

suporte.post('/', zValidator('json', schema, entradaInvalida), async (c) => {
  const { email, assunto, mensagem, site } = c.req.valid('json');
  if (site) return c.json({ enviado: true }, 202);

  const db = c.env.DB;
  const ipHash = await sha256(`suporte:${c.req.header('CF-Connecting-IP') ?? 'local'}`);
  const [doIp, hoje, usuario] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) AS n FROM suporte_mensagens WHERE ip_hash = ? AND criado_em > datetime('now', '-1 hour')")
      .bind(ipHash)
      .first<{ n: number }>(),
    db
      .prepare("SELECT COUNT(*) AS n FROM suporte_mensagens WHERE criado_em > datetime('now', '-1 day')")
      .first<{ n: number }>(),
    usuarioOpcional(c),
  ]);
  const limite = podeEnviarSuporte({ doIpNaUltimaHora: doIp?.n ?? 0, totalHoje: hoje?.n ?? 0 });
  if (limite) return c.json({ error: limite }, 429);

  const id = crypto.randomUUID();
  await db
    .prepare(
      'INSERT INTO suporte_mensagens (id, user_id, email_resposta, assunto, mensagem, ip_hash) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(id, usuario?.id ?? null, email, assunto, mensagem, ipHash)
    .run();

  const chave = c.env.RESEND_API_KEY;
  if (!chave) {
    console.error('suporte: RESEND_API_KEY não configurada; mensagem guardada sem envio', id);
    return c.json({ error: 'envio_indisponivel' }, 503);
  }

  const quem = usuario
    ? `${usuario.nome} (@${usuario.discordUsername}, conta ${usuario.id})`
    : 'Visitante sem login (pode ser uma conta suspensa)';
  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: REMETENTE,
      to: [EMAIL_SUPORTE],
      reply_to: email,
      subject: `[TeamUp] ${linhaUnica(assunto)}`,
      // Só texto: nada do que o usuário escreveu é interpretado como HTML
      text: `Nova mensagem pelo formulário de suporte\n\nDe: ${email}\nQuem: ${quem}\nAmbiente: ${c.env.APP_ENV}\nProtocolo: ${id}\n\n${mensagem}\n\n— Responda este e-mail para falar direto com a pessoa.`,
    }),
  });
  if (!resposta.ok) {
    console.error('suporte: Resend respondeu', resposta.status, id);
    return c.json({ error: 'envio_indisponivel' }, 503);
  }

  await db.prepare('UPDATE suporte_mensagens SET enviado = 1 WHERE id = ?').bind(id).run();
  return c.json({ enviado: true, protocolo: id.slice(0, 8) }, 201);
});
