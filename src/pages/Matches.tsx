import { Link, useNavigate } from 'react-router';
import iconeCheck from '../assets/icons/circle-check.svg';
import iconeEstrela from '../assets/icons/star.svg';
import { Avatar } from '../components/Avatar';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { Cartao } from '../components/Cartao';
import { Estrelas } from '../components/Estrelas';
import { Icone } from '../components/Icone';
import { Indicador } from '../components/Indicador';
import { Layout } from '../components/Layout';
import { buscarMatches } from '../lib/convites';
import { formatarData, formatarDataHora } from '../lib/datas';
import { rotulo } from '../lib/jogadores';
import { ELOS, FUNCOES } from '../lib/perfil';
import { useProtegido } from '../lib/useProtegido';

/** Histórico de matches (RF09) com o status da avaliação de cada um (RF10, RN04). */
export function Matches() {
  const { dados, erro, recarregar } = useProtegido(buscarMatches);
  const navigate = useNavigate();
  const pendentes = dados?.matches.filter((m) => !m.minhaAvaliacao).length ?? 0;

  return (
    <Layout navegacao>
      <header className="flex w-full flex-col gap-4.5">
        <p className="text-xs font-bold text-destaque">SUAS PARCERIAS</p>
        <h1 className="text-titulo font-bold lg:text-titulo-grande">Matches</h1>
        <p className="text-md text-texto-suave">
          Gente boa que cruzou seu caminho. Mantenha o contato e compartilhe como foi jogar junto.
        </p>
      </header>

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          {erro ? (
            <>
              <Aviso titulo="Não foi possível carregar seus matches.">Verifique sua conexão e tente de novo.</Aviso>
              <Botao variante="secundario" onClick={recarregar}>
                Tentar de novo
              </Botao>
            </>
          ) : !dados ? (
            <p role="status" className="text-texto-suave">
              Carregando...
            </p>
          ) : dados.matches.length === 0 ? (
            <Cartao className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <h2 className="text-xl font-bold">Nenhum match ainda</h2>
              <p className="text-texto-suave">Quando alguém aceitar seu convite (ou você aceitar um), o duo aparece aqui.</p>
              <Link to="/buscar" className="font-bold text-destaque hover:underline">
                Ir para Buscar
              </Link>
            </Cartao>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <p className="text-texto-suave">
                  {dados.matches.length} {dados.matches.length === 1 ? 'match' : 'matches'}
                  {pendentes > 0 && ` · ${pendentes} ${pendentes === 1 ? 'avaliação pendente' : 'avaliações pendentes'}`}
                </p>
                <p className="text-xs font-bold text-texto-suave">● Mais recentes</p>
              </div>
              <ul className="flex flex-col gap-4">
                {dados.matches.map((m) => (
                  <li key={m.id}>
                    <Cartao className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar nome={m.jogador.nome} semente={m.jogador.id} tamanho="comentario" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-card font-bold">{m.jogador.nome}</p>
                          <p className="text-sm text-texto-suave">
                            {[rotulo(ELOS, m.jogador.elo), rotulo(FUNCOES, m.jogador.funcaoPrimaria)]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <p className="text-xs text-texto-suave">{formatarDataHora(m.data)}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-3 sm:w-33">
                          {m.minhaAvaliacao ? (
                            <Indicador tom="destaque" icone={iconeCheck}>
                              Avaliado
                            </Indicador>
                          ) : (
                            <Botao
                              cheio={false}
                              compacto
                              className="sm:w-full"
                              onClick={() => navigate(`/matches/${m.id}/avaliar`)}
                            >
                              <Icone src={iconeEstrela} tamanho={16} colorir />
                              Avaliar<span className="sr-only"> {m.jogador.nome}</span>
                            </Botao>
                          )}
                          <Link
                            to={`/matches/${m.id}`}
                            className="rounded-caixa text-sm text-destaque hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
                          >
                            Ver contatos<span className="sr-only"> de {m.jogador.nome}</span> →
                          </Link>
                        </div>
                      </div>
                      {m.minhaAvaliacao && (
                        <p className="flex items-center gap-1 text-xs text-estrela">
                          <Estrelas nota={m.minhaAvaliacao.nota} tamanho="text-sm" />· Você avaliou {m.jogador.nome} em{' '}
                          {formatarData(m.minhaAvaliacao.data)}
                        </p>
                      )}
                    </Cartao>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <div className="lg:w-66 lg:shrink-0">
          <Aviso tom="info" titulo="Sua experiência importa">
            Depois da partida, avalie seu duo. Só uma avaliação por match, para manter a reputação confiável.
          </Aviso>
        </div>
      </div>
    </Layout>
  );
}
