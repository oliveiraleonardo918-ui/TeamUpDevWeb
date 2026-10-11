import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import iconeConvidar from '../assets/icons/user-plus-escuro.svg';
import { Avatar } from '../components/Avatar';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { Cartao } from '../components/Cartao';
import { Estrelas, formatarNota } from '../components/Estrelas';
import { Icone } from '../components/Icone';
import { Indicador } from '../components/Indicador';
import { Layout } from '../components/Layout';
import { buscarPerfilPublico, iconeFuncao, resumoJogo, rotulo, type PerfilPublico } from '../lib/jogadores';
import { ELOS, FUNCOES, GENEROS } from '../lib/perfil';
import { useProtegido } from '../lib/useProtegido';

const AVALIACOES_INICIAIS = 3;

function formatarData(sql: string): string {
  // "2026-10-09 21:30:00" (UTC, do SQLite) → "09/10/2026"
  return new Date(`${sql.replace(' ', 'T')}Z`).toLocaleDateString('pt-BR');
}

/** Perfil público de um jogador (RF06): dados de jogo, reputação e avaliações. Sem contatos (RN02). */
export function PerfilJogador() {
  const { id = '' } = useParams();
  const buscar = useCallback(() => buscarPerfilPublico(id), [id]);
  const { dados, erro, recarregar } = useProtegido(buscar);
  const navigate = useNavigate();

  function voltar() {
    // Volta para a busca com os mesmos filtros quando veio de lá
    if (window.history.length > 1) navigate(-1);
    else navigate('/buscar');
  }

  return (
    <Layout navegacao>
      <button
        type="button"
        onClick={voltar}
        className="self-start rounded-caixa text-destaque hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
      >
        ← Voltar para Buscar
      </button>
      <header className="flex w-full flex-col gap-4.5">
        <p className="text-xs font-bold text-destaque">PERFIL PÚBLICO</p>
        <h1 className="text-titulo font-bold lg:text-titulo-grande">Conheça seu próximo duo</h1>
        <p className="text-md text-texto-suave">Uma boa parceria vai além do elo.</p>
      </header>

      {erro === 'nao_encontrado' ? (
        <div className="flex w-full flex-col gap-4">
          <Aviso titulo="Jogador não encontrado.">Esse perfil não existe ou não está mais disponível.</Aviso>
          <Link to="/buscar" className="self-start font-bold text-destaque hover:underline">
            Ir para Buscar
          </Link>
        </div>
      ) : erro ? (
        <div className="flex w-full flex-col gap-4">
          <Aviso titulo="Não foi possível carregar este perfil.">Verifique sua conexão e tente de novo.</Aviso>
          <Botao variante="secundario" onClick={recarregar}>
            Tentar de novo
          </Botao>
        </div>
      ) : dados ? (
        <Conteudo p={dados} />
      ) : (
        <p role="status" className="w-full text-texto-suave">
          Carregando...
        </p>
      )}
    </Layout>
  );
}

function Conteudo({ p }: { p: PerfilPublico }) {
  const [verTodas, setVerTodas] = useState(false);
  const funcoes = [p.funcaoPrimaria, p.funcaoSecundaria].filter((f) => f !== null);
  const r = p.reputacao;
  const avaliacoes = verTodas ? p.avaliacoes : p.avaliacoes.slice(0, AVALIACOES_INICIAIS);

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-6 lg:w-92 lg:shrink-0">
        <Cartao className="flex flex-col gap-5">
          <Avatar nome={p.nome} semente={p.id} tamanho="grande" />
          <div className="flex items-center gap-3">
            <h2 className="min-w-0 flex-1 truncate text-3xl font-bold">{p.nome}</h2>
            {p.elo && <Indicador tom="neutro">{rotulo(ELOS, p.elo)}</Indicador>}
          </div>
          {funcoes.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Funções">
              {funcoes.map((f) => (
                <li key={f}>
                  <Indicador tom="neutro" icone={iconeFuncao(f)}>
                    {rotulo(FUNCOES, f)}
                  </Indicador>
                </li>
              ))}
            </ul>
          )}
          <p className="text-texto-suave">{resumoJogo(p)}</p>
          {p.genero && <p className="text-xs font-bold text-texto-suave">● {rotulo(GENEROS, p.genero)}</p>}
          {p.bio && (
            <>
              <hr className="border-borda" />
              <p className="text-md">{p.bio}</p>
            </>
          )}
          <Botao disabled title="Disponível na próxima atualização">
            <Icone src={iconeConvidar} tamanho={18} />
            Convidar para duo
          </Botao>
          <p className="-mt-2 text-center text-xs text-texto-suave">Os convites chegam na próxima atualização.</p>
        </Cartao>
        <Aviso tom="info" titulo="Contatos protegidos">
          Riot ID e Discord só aparecem depois de um match mútuo.
        </Aviso>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <Cartao className="flex flex-col gap-5">
          <h2 className="text-xl font-bold">Reputação real</h2>
          {r.nota !== null && r.distribuicao ? (
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
              <div className="flex flex-col gap-2 sm:w-45">
                <p className="text-nota font-bold">{formatarNota(r.nota)}</p>
                <Estrelas nota={r.nota} tamanho="text-card" />
                <p className="text-sm text-texto-suave">{r.total} avaliações</p>
              </div>
              <ul className="flex flex-1 flex-col gap-3" aria-label="Distribuição das notas">
                {[5, 4, 3, 2, 1, 0].map((n) => {
                  const qtd = r.distribuicao![n];
                  return (
                    <li key={n} className="flex items-center gap-2.5 text-xs">
                      <span className="w-7 text-estrela">
                        {n} <span aria-hidden="true">★</span>
                        <span className="sr-only">estrelas</span>
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-borda">
                        <span
                          className="block h-1.5 rounded-full bg-estrela"
                          style={{ width: `${(qtd / r.total) * 100}%` }}
                        />
                      </span>
                      <span className="w-5.5 text-texto-suave">{qtd}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-subtitulo font-bold">Novo jogador</p>
              <p className="text-sm text-texto-suave">
                A nota aparece a partir de 3 avaliações.{' '}
                {r.total > 0 && `Até agora, ${r.total} ${r.total === 1 ? 'avaliação' : 'avaliações'}.`}
              </p>
            </div>
          )}
          <p className="text-xs text-texto-suave">
            Apenas duos que deram match podem avaliar. Uma avaliação por partida combinada.
          </p>
        </Cartao>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Avaliações recebidas</h2>
          <p className="text-sm text-texto-suave">
            {p.avaliacoes.length} {p.avaliacoes.length === 1 ? 'comentário' : 'comentários'}
          </p>
        </div>

        {p.avaliacoes.length === 0 ? (
          <p className="text-texto-suave">Ainda não há comentários.</p>
        ) : (
          <ul className="flex flex-col gap-6">
            {avaliacoes.map((a) => (
              <li key={`${a.autorId}-${a.data}`}>
                <Cartao className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar nome={a.autorNome} semente={a.autorId} tamanho="comentario" />
                    <div>
                      <p className="font-bold">{a.autorNome}</p>
                      <p className="text-xs text-texto-suave">{formatarData(a.data)}</p>
                    </div>
                  </div>
                  {a.nota !== null && <Estrelas nota={a.nota} />}
                  <p>{a.comentario}</p>
                </Cartao>
              </li>
            ))}
          </ul>
        )}

        {!verTodas && p.avaliacoes.length > AVALIACOES_INICIAIS && (
          <Botao variante="secundario" onClick={() => setVerTodas(true)}>
            Ver todas as {p.avaliacoes.length} avaliações
          </Botao>
        )}
      </div>
    </div>
  );
}
