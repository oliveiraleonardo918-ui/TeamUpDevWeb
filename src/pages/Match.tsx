import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import iconeLink from '../assets/icons/link.svg';
import { Avatar } from '../components/Avatar';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { Cartao } from '../components/Cartao';
import { Icone } from '../components/Icone';
import { Indicador } from '../components/Indicador';
import { Layout } from '../components/Layout';
import { buscarMatch, type DetalheMatch } from '../lib/convites';
import { formatarData } from '../lib/datas';
import { useProtegido } from '../lib/useProtegido';

/** "Deu match!" (RF09): com o aceite mútuo, Riot ID e Discord do parceiro aparecem (RN02). */
export function Match() {
  const { id = '' } = useParams();
  const buscar = useCallback(() => buscarMatch(id), [id]);
  const { dados, erro, recarregar } = useProtegido(buscar);

  return (
    <Layout navegacao>
      <div className="flex w-full max-w-137 flex-col gap-6">
        {erro === 'nao_encontrado' ? (
          <>
            <Aviso titulo="Match não encontrado.">
              Esse match não existe, não é seu ou o outro jogador não está mais disponível.
            </Aviso>
            <Link to="/matches" className="self-start font-bold text-destaque hover:underline">
              Ver meus matches
            </Link>
          </>
        ) : erro ? (
          <>
            <Aviso titulo="Não foi possível carregar o match.">Verifique sua conexão e tente de novo.</Aviso>
            <Botao variante="secundario" onClick={recarregar}>
              Tentar de novo
            </Botao>
          </>
        ) : dados ? (
          <Conteudo m={dados} />
        ) : (
          <p role="status" className="text-texto-suave">
            Carregando...
          </p>
        )}
      </div>
    </Layout>
  );
}

function Conteudo({ m }: { m: DetalheMatch }) {
  const navigate = useNavigate();
  const p = m.parceiro;
  return (
    <>
      <section className="flex flex-col items-center gap-6 pt-2 text-center">
        <Indicador>Convite aceito · {formatarData(m.data)}</Indicador>
        <h1 className="text-titulo-grande font-bold">Deu match!</h1>
        <p className="text-md text-texto-suave">
          {m.eu.nome} e {p.nome}, boa partida começa com boa companhia.
        </p>
        <div className="flex items-center gap-4">
          <figure className="flex flex-col items-center gap-2">
            <Avatar nome={m.eu.nome} semente={m.eu.id} />
            <figcaption className="text-sm font-bold">{m.eu.nome}</figcaption>
          </figure>
          <span className="mb-7 flex size-9 items-center justify-center rounded-full bg-roxo-fundo">
            <Icone src={iconeLink} tamanho={18} />
          </span>
          <figure className="flex flex-col items-center gap-2">
            <Avatar nome={p.nome} semente={p.id} />
            <figcaption className="text-sm font-bold">{p.nome}</figcaption>
          </figure>
        </div>
      </section>

      <Cartao className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Contatos de {p.nome}</h2>
        <p className="text-sm text-texto-suave">Agora vocês dois aceitaram. Combine a partida pelo Discord.</p>
        <Contato rotulo="Riot ID" valor={p.riotId} />
        <Contato rotulo="Discord" valor={p.discordUsername} />
        <a
          href={p.discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center rounded-lg bg-destaque px-4 font-bold text-destaque-contraste transition-colors hover:bg-destaque-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
        >
          Abrir Discord<span className="sr-only"> (abre em nova aba)</span>
        </a>
      </Cartao>

      <Aviso tom="roxo" titulo="Depois da partida, avalie seu duo">
        Sua experiência ajuda a manter a comunidade acolhedora e respeitosa.
      </Aviso>

      <Botao variante="secundario" onClick={() => navigate('/matches')}>
        Ver Matches
      </Botao>
    </>
  );
}

function Contato({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!valor) return;
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o texto continua visível para copiar à mão
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-fundo p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-texto-suave">{rotulo}</p>
        <p className="truncate text-md font-bold select-all">{valor ?? 'Não informado'}</p>
      </div>
      {valor && (
        <button
          type="button"
          onClick={copiar}
          className="h-9 shrink-0 rounded-lg bg-superficie-elevada px-3 text-sm font-bold transition-colors hover:bg-borda focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
        >
          <span aria-live="polite">{copiado ? 'Copiado!' : 'Copiar'}</span>
          <span className="sr-only"> {rotulo}</span>
        </button>
      )}
    </div>
  );
}
