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
  /** Formulário com arquivos: o navegador define o Content-Type (multipart) com o boundary. */
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};

/** Inicia o OAuth do Discord (navegação de página inteira, não fetch). `maior18`: declaração do RN06. */
export const urlLoginDiscord = '/api/auth/discord?maior18=1';

export interface Me {
  id: string;
  nome: string;
  discordUsername: string;
  avatarUrl: string | null;
  papel: 'jogador' | 'moderador' | 'admin';
  convitesPendentes: number;
}

export const buscarMe = () => api.get<Me>('/me');
export const sair = () => api.post<null>('/auth/logout');
/** RNF09: exclui (anonimiza) a própria conta; `confirmacao` precisa ser "EXCLUIR". */
export const excluirConta = (confirmacao: string) => api.post<null>('/me/excluir', { confirmacao });
