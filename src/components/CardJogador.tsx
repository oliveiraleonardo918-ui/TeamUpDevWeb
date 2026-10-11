import { Link } from 'react-router';
import { formatarNota } from './Estrelas';
import { Avatar } from './Avatar';
import { Cartao } from './Cartao';
import { Indicador } from './Indicador';
import { iconeFuncao, resumoJogo, rotulo, type CardJogador as Dados } from '../lib/jogadores';
import { ELOS, FUNCOES } from '../lib/perfil';

/** Player Card da busca (RF05). Sem Riot ID nem Discord (RN02). */
export function CardJogador({ jogador: j }: { jogador: Dados }) {
  const funcoes = [j.funcaoPrimaria, j.funcaoSecundaria].filter((f) => f !== null);
  return (
    <Cartao className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar nome={j.nome} semente={j.id} foto={j.avatarUrl} para={`/jogadores/${j.id}`} tamanho="card" />
        <h3 className="min-w-0 flex-1 truncate text-card font-bold">{j.nome}</h3>
        {j.elo && <Indicador tom="neutro">{rotulo(ELOS, j.elo)}</Indicador>}
      </div>
      {funcoes.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Funções">
          {funcoes.map((f) => (
            <li key={f}>
              <Indicador tom="neutro" icone={iconeFuncao(f)}>
                {rotulo(FUNCOES, f)}
              </Indicador>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-texto-suave">{resumoJogo(j)}</p>
      {j.nota !== null ? (
        <p className="text-sm text-estrela">
          <span aria-hidden="true">★ </span>
          {formatarNota(j.nota)} ({j.avaliacoes} {j.avaliacoes === 1 ? 'avaliação' : 'avaliações'})
        </p>
      ) : (
        <p className="text-sm text-texto-suave">Novo jogador</p>
      )}
      <Link
        to={`/jogadores/${j.id}`}
        className="flex h-12 items-center justify-center rounded-lg border border-borda bg-superficie-elevada px-4 font-bold transition-colors hover:border-texto-suave hover:bg-borda focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
      >
        Ver perfil<span className="sr-only"> de {j.nome}</span>
      </Link>
    </Cartao>
  );
}

/** Esqueleto do card enquanto a busca carrega. */
export function CardJogadorCarregando() {
  const bloco = 'rounded-caixa bg-borda';
  return (
    <Cartao aria-hidden="true" className="flex animate-pulse flex-col gap-4 opacity-70">
      <div className="flex items-center gap-3">
        <span className="size-12 rounded-full bg-borda" />
        <div className="flex flex-col gap-2">
          <span className={`h-3 w-28 ${bloco}`} />
          <span className={`h-2 w-16 ${bloco}`} />
        </div>
      </div>
      <span className={`h-5 w-44 ${bloco}`} />
      <span className={`h-2.5 w-full ${bloco}`} />
      <span className={`h-2.5 w-34 ${bloco}`} />
      <span className="h-12 w-full rounded-lg bg-borda" />
    </Cartao>
  );
}
