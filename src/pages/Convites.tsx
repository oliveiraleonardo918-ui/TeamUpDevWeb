import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { Cartao } from '../components/Cartao';
import { formatarNota } from '../components/Estrelas';
import { ErroConexao } from '../components/ErroConexao';
import { Layout } from '../components/Layout';
import { aceitarConvite, buscarConvites, recusarConvite, type Convite } from '../lib/convites';
import { formatarDataHora } from '../lib/datas';
import { rotulo, type CardJogador } from '../lib/jogadores';
import { ELOS, ESTILOS, FUNCOES, TURNOS } from '../lib/perfil';
import { useProtegido } from '../lib/useProtegido';

type Aba = 'recebidos' | 'enviados';

const SUBTITULOS: Record<Aba, string> = {
  recebidos: 'Você escolhe com quem quer jogar. Aceite só quando se sentir à vontade.',
  enviados: 'Acompanhe suas respostas. O contato só é liberado quando o convite é aceito.',
};

const STATUS = {
  pendente: { rotulo: 'Pendente', cor: 'text-roxo', texto: 'Aguardando a resposta. Seus contatos ainda estão privados.' },
  aceito: { rotulo: 'Aceito', cor: 'text-destaque', texto: 'Vocês já podem compartilhar os contatos.' },
  recusado: { rotulo: 'Recusado', cor: 'text-texto-suave', texto: 'Tudo bem. Outras parcerias esperam por você.' },
} as const;

/** Caixa de convites (RF08): recebidos (aceitar/recusar) e enviados (acompanhar). */
export function Convites() {
  const { dados, erro, recarregar } = useProtegido(buscarConvites);
  const [params, setParams] = useSearchParams();
  const aba: Aba = params.get('aba') === 'enviados' ? 'enviados' : 'recebidos';
  const enviadoPara = params.get('enviado');

  function trocarAba(nova: Aba) {
    setParams({ aba: nova }, { replace: true });
  }

  return (
    <Layout navegacao>
      <header className="flex w-full flex-col gap-4.5">
        <p className="text-xs font-bold text-destaque">SUA CAIXA DE CONVITES</p>
        <h1 className="text-titulo font-bold lg:text-titulo-grande">Um convite para jogar junto</h1>
        <p className="text-md text-texto-suave">{SUBTITULOS[aba]}</p>
      </header>

      {enviadoPara && (
        <Aviso tom="info" titulo={`Convite enviado para ${enviadoPara}`}>
          Vamos avisar quando houver uma resposta.
        </Aviso>
      )}

      {erro ? (
        <div className="flex w-full flex-col gap-4">
          <ErroConexao oQue="seus convites" onTentar={recarregar} />
        </div>
      ) : !dados ? (
        <p role="status" className="w-full text-texto-suave">
          Carregando...
        </p>
      ) : (
        <>
          <div role="tablist" aria-label="Convites" className="flex w-full gap-4 text-xs font-bold">
            {(['recebidos', 'enviados'] as const).map((a) => (
              <button
                key={a}
                type="button"
                role="tab"
                aria-selected={aba === a}
                onClick={() => trocarAba(a)}
                className={`rounded-caixa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque ${aba === a ? 'text-destaque' : 'text-texto-suave hover:text-texto'}`}
              >
                ● {a === 'recebidos' ? 'Recebidos' : 'Enviados'} ({dados[a].length})
              </button>
            ))}
          </div>

          <section role="tabpanel" className="w-full">
            {aba === 'recebidos' ? (
              <Recebidos convites={dados.recebidos} onMudou={recarregar} />
            ) : (
              <Enviados convites={dados.enviados} />
            )}
          </section>

          <p className="w-full text-xs text-texto-suave">
            Recusar um convite não afeta sua reputação. Riot ID e Discord não aparecem antes do aceite mútuo.
          </p>
        </>
      )}
    </Layout>
  );
}

function Cabecalho({ j }: { j: CardJogador }) {
  const linha1 = [rotulo(ELOS, j.elo), ...j.turnos.map((t) => rotulo(TURNOS, t))].filter(Boolean).join(' · ');
  const linha2 = [rotulo(FUNCOES, j.funcaoPrimaria), rotulo(FUNCOES, j.funcaoSecundaria), rotulo(ESTILOS, j.estilo)]
    .filter(Boolean)
    .join(' · ');
  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar nome={j.nome} semente={j.id} tamanho="comentario" />
        <Link
          to={`/jogadores/${j.id}`}
          className="min-w-0 truncate rounded-caixa text-card font-bold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
        >
          {j.nome}
        </Link>
      </div>
      <p className="text-sm text-texto-suave">
        {linha1}
        {linha2 && (
          <>
            <br />
            {linha2}
          </>
        )}
      </p>
      {j.nota !== null ? (
        <p className="text-sm text-estrela">
          <span aria-hidden="true">★ </span>
          {formatarNota(j.nota)} ({j.avaliacoes} avaliações)
        </p>
      ) : (
        <p className="text-sm text-texto-suave">Novo jogador</p>
      )}
    </>
  );
}

function Recebidos({ convites, onMudou }: { convites: Convite[]; onMudou: () => void }) {
  const navigate = useNavigate();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [falha, setFalha] = useState(false);

  async function responder(c: Convite, aceitar: boolean) {
    setOcupado(c.id);
    setFalha(false);
    try {
      if (aceitar) {
        const { matchId } = await aceitarConvite(c.id);
        navigate(`/matches/${matchId}`);
        return;
      }
      await recusarConvite(c.id);
      onMudou();
    } catch {
      setFalha(true);
      onMudou();
    } finally {
      setOcupado(null);
    }
  }

  if (convites.length === 0) {
    return (
      <Vazio titulo="Nenhum convite por enquanto" texto="Que tal procurar alguém com afinidade e convidar?" />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {falha && <Aviso titulo="Esse convite não está mais disponível.">Atualizamos sua lista.</Aviso>}
      <ul className="grid gap-4 lg:grid-cols-2">
        {convites.map((c) => (
          <li key={c.id}>
            <Cartao className="flex flex-col gap-4">
              <Cabecalho j={c.jogador} />
              <p className="text-xs text-texto-suave">Recebido em {formatarDataHora(c.data)}</p>
              <div className="flex gap-3">
                <Botao
                  variante="secundario"
                  className="flex-1"
                  disabled={ocupado !== null}
                  onClick={() => responder(c, false)}
                >
                  Recusar<span className="sr-only"> convite de {c.jogador.nome}</span>
                </Botao>
                <Botao className="flex-1" disabled={ocupado !== null} onClick={() => responder(c, true)}>
                  {ocupado === c.id ? 'Aguarde...' : 'Aceitar'}
                  <span className="sr-only"> convite de {c.jogador.nome}</span>
                </Botao>
              </div>
            </Cartao>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Enviados({ convites }: { convites: Convite[] }) {
  const navigate = useNavigate();
  if (convites.length === 0) {
    return <Vazio titulo="Você ainda não enviou convites" texto="Encontre um duo na busca e envie o primeiro." />;
  }
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      {convites.map((c) => {
        const s = STATUS[c.status];
        return (
          <li key={c.id}>
            <Cartao className="flex h-full flex-col gap-4">
              <Cabecalho j={c.jogador} />
              <p className="text-xs text-texto-suave">Enviado em {formatarDataHora(c.data)}</p>
              <p className={`text-xs font-bold ${s.cor}`}>● {s.rotulo}</p>
              <p className="text-sm text-texto-suave">{s.texto}</p>
              {c.status === 'aceito' && (
                <Botao variante="secundario" className="mt-auto" onClick={() => navigate(`/matches/${c.id}`)}>
                  Ver match
                </Botao>
              )}
            </Cartao>
          </li>
        );
      })}
    </ul>
  );
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <Cartao className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="text-texto-suave">{texto}</p>
      <Link to="/buscar" className="font-bold text-destaque hover:underline">
        Ir para Buscar
      </Link>
    </Cartao>
  );
}
