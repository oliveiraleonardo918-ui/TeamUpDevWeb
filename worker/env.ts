// Tipos compartilhados do Worker. `Env` vem do `wrangler types` (worker-configuration.d.ts).

export interface Usuario {
  id: string;
  discordId: string;
  nome: string;
  discordUsername: string;
  avatar: string | null;
  isAdmin: boolean;
}

export type AppEnv = {
  Bindings: Env;
  Variables: { usuario: Usuario };
};
