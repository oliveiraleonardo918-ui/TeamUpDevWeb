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

export type AppEnv = {
  Bindings: Env;
  Variables: { usuario: Usuario };
};
