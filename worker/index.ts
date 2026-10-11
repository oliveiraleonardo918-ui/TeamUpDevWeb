import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';

type Bindings = {
  DB: D1Database;
  APP_ENV: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// Headers de segurança em todas as respostas da API (CSP, nosniff, frame-options...)
app.use('*', secureHeaders());

// Health check: usado pelas probes do Kubernetes e pelo smoke test do deploy
app.get('/health', async (c) => {
  const row = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
  return c.json({ status: row?.ok === 1 ? 'ok' : 'degraded', env: c.env.APP_ENV });
});

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  // Nunca devolver stack trace ao cliente
  console.error(err);
  return c.json({ error: 'internal_error' }, 500);
});

export default app;
