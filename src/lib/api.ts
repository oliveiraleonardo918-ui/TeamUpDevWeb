// Cliente da API. A sessão vai no cookie HttpOnly (mesma origem); nada de token no JS.

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...init.headers },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const code = (body as { error?: string } | null)?.error ?? 'erro_desconhecido';
    throw new ApiError(res.status, code);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
};

/** Inicia o OAuth do Discord (navegação de página inteira, não fetch). */
export const urlLoginDiscord = '/api/auth/discord';
