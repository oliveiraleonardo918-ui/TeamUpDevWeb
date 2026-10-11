// Tipos compartilhados do Worker. `Env` vem do `wrangler types` (worker-configuration.d.ts).
import type { Papel } from './rules';

export interface Usuario {
  id: string;
  discordId: string;
  nome: string;
  discordUsername: string;
  avatar: string | null;
  /** admin vem de ADMIN_DISCORD_IDS; moderador, do banco */
  papel: Papel;
}

/** Secrets opcionais (nem todo ambiente tem): RESEND_API_KEY envia o e-mail do formulário de suporte. */
export type Bindings = Env & { RESEND_API_KEY?: string };

export type AppEnv = {
  Bindings: Bindings;
  Variables: { usuario: Usuario };
};
