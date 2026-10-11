import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import iconeCheck from '../assets/icons/circle-check.svg';
import { Avatar } from '../components/Avatar';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { AreaTexto } from '../components/Campo';
import { Cartao } from '../components/Cartao';
import { EscolhaEstrelas } from '../components/EscolhaEstrelas';
import { Estrelas, formatarNota } from '../components/Estrelas';
import { Icone } from '../components/Icone';
import { ErroConexao } from '../components/ErroConexao';
import { Layout } from '../components/Layout';
import { ApiError } from '../lib/api';
import { avaliarMatch, buscarMatch, COMENTARIO_MAX, ROTULOS_NOTA, type DetalheMatch } from '../lib/convites';
import { formatarData } from '../lib/datas';
import { useProtegido } from '../lib/useProtegido';

/** Avaliar o parceiro do match (RF10), uma vez por match (RN04). */
export function Avaliar() {
  const { id = '' } = useParams();
  const buscar = useCallback(() => buscarMatch(id), [id]);
  const { dados, erro, recarregar } = useProtegido(buscar);
  const enviada = Boolean(dados?.minhaAvaliacao);

  return (
    <Layout navegacao>
      <Link
        to="/matches"
        className="self-start rounded-caixa text-destaque hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
      >
        ← Voltar para Matches
      </Link>
      <header className="flex w-full flex-col gap-4.5">
        <p className="text-xs font-bold text-destaque">REPUTAÇÃO REAL</p>
        <h1 className="text-titulo font-bold lg:text-titulo-grande">
          {enviada ? 'Avaliação enviada!' : 'Como foi jogar junto?'}
        </h1>
        <p className="text-md text-texto-suave">
          {enviada
            ? 'Valeu por ajudar a construir uma comunidade mais respeitosa.'
            : 'Conte sua experiência com respeito. Sua avaliação ajuda outras pessoas a escolherem seu duo.'}
        </p>
      </header>

      {erro === 'nao_encontrado' ? (
        <Aviso titulo="Match não encontrado.">Só é possível avaliar quem formou um duo com você.</Aviso>
      ) : erro ? (
        <div className="flex w-full flex-col gap-4">
          <ErroConexao oQue="o match" onTentar={recarregar} />
        </div>
      ) : !dados ? (
        <p role="status" className="w-full text-texto-suave">
          Carregando...
        </p>
      ) : (
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
          <Cartao className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex items-center gap-3">
              <Avatar nome={dados.parceiro.nome} semente={dados.parceiro.id} tamanho="comentario" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-subtitulo font-bold">{dados.parceiro.nome}</p>
                <p className="text-xs text-texto-suave">Match de {formatarData(dados.data)}</p>
              </div>
              {enviada && <Icone src={iconeCheck} tamanho={24} rotulo="Avaliado" />}
            </div>
            {dados.minhaAvaliacao ? <Enviada m={dados} /> : <Formulario m={dados} onEnviada={recarregar} />}
          </Cartao>

          <div className="flex flex-col gap-4 lg:w-66 lg:shrink-0">
            <Aviso tom="info" titulo="Avalie a parceria, não o placar">
              Pense na comunicação e no respeito. Não inclua informações pessoais.
            </Aviso>
            {enviada && dados.parceiro.reputacao.nota !== null && (
              <p className="text-xs text-estrela">
                {dados.parceiro.nome} agora tem ★ {formatarNota(dados.parceiro.reputacao.nota)} (
                {dados.parceiro.reputacao.total} avaliações).
              </p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

function Formulario({ m, onEnviada }: { m: DetalheMatch; onEnviada: () => void }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (nota < 1) return;
    setEnviando(true);
    setErro(null);
    try {
      await avaliarMatch(m.id, nota, comentario.trim());
      onEnviada();
    } catch (err) {
      if (err instanceof ApiError && err.message === 'ja_avaliado') {
        onEnviada();
        return;
      }
      setErro('Não foi possível enviar sua avaliação. Tente de novo.');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <EscolhaEstrelas legenda="Sua nota (obrigatória)" valor={nota} onChange={setNota} />
        <p className={`text-xs ${nota ? 'text-estrela' : 'text-texto-suave'}`} aria-live="polite">
          {nota ? `${nota} de 5 · ${ROTULOS_NOTA[nota]}` : '0 de 5 · Selecione de 1 a 5 estrelas'}
        </p>
      </div>
      <AreaTexto
        rotulo="Comentário (opcional)"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        maxLength={COMENTARIO_MAX}
        placeholder="Escreva como foi a experiência…"
        ajuda={`${comentario.length}/${COMENTARIO_MAX} caracteres`}
      />
      {erro && <Aviso titulo={erro} />}
      <Botao type="submit" disabled={nota < 1 || enviando}>
        {enviando ? 'Enviando...' : 'Enviar avaliação'}
      </Botao>
      <p className="text-xs text-texto-suave">
        Só uma avaliação por match. {nota ? 'Confira antes de enviar.' : 'Escolha uma nota para continuar.'}
      </p>
    </form>
  );
}

function Enviada({ m }: { m: DetalheMatch }) {
  const navigate = useNavigate();
  const a = m.minhaAvaliacao!;
  return (
    <>
      <p className="text-xs font-bold text-destaque">● Avaliado · {formatarData(a.data)}</p>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold">Sua nota</p>
        <Estrelas nota={a.nota} tamanho="text-4xl" />
        <p className="text-xs text-estrela">
          {a.nota} de 5{ROTULOS_NOTA[a.nota] && ` · ${ROTULOS_NOTA[a.nota]}`}
        </p>
      </div>
      {a.comentario && (
        <div className="flex flex-col gap-3 rounded-xl border border-borda p-4">
          <p className="text-xs text-texto-suave">SEU COMENTÁRIO</p>
          <p>{a.comentario}</p>
        </div>
      )}
      <Aviso tom="info" titulo="Uma avaliação por match">
        Sua avaliação foi registrada e não pode ser enviada novamente.
      </Aviso>
      <Botao onClick={() => navigate('/matches')}>Voltar para Matches</Botao>
    </>
  );
}
