import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import iconeControle from '../assets/icons/gamepad-2-pequeno.svg';
import iconeCarregando from '../assets/icons/loader-circle.svg';
import iconeLupa from '../assets/icons/search.svg';
import iconeFiltros from '../assets/icons/sliders-horizontal.svg';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { CardJogador, CardJogadorCarregando } from '../components/CardJogador';
import { Cartao } from '../components/Cartao';
import { Folha } from '../components/Folha';
import { Icone } from '../components/Icone';
import { Indicador } from '../components/Indicador';
import { ErroConexao } from '../components/ErroConexao';
import { Layout } from '../components/Layout';
import { PainelFiltros } from '../components/PainelFiltros';
import { ApiError } from '../lib/api';
import {
  buscarJogadores,
  GENEROS_FILTRO,
  lerFiltros,
  paraParams,
  rotulo,
  type CardJogador as Card,
  type Filtros,
} from '../lib/jogadores';
import { buscarPerfil, ELOS, ESTILOS, FUNCOES, TURNOS, type RespostaPerfil } from '../lib/perfil';
import { useProtegido } from '../lib/useProtegido';

type Resultado = { chave: string } & ({ jogadores: Card[] } | { erro: true });

/** Buscar duo (RF05): Player Cards com filtros. Exige perfil mínimo (RN01). */
export function Buscar() {
  const { dados: eu, erro: erroPerfil, recarregar } = useProtegido(buscarPerfil);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const chave = params.toString();
  const filtros = lerFiltros(params);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [folhaAberta, setFolhaAberta] = useState(false);

  const liberada = eu?.buscaLiberada ?? false;

  useEffect(() => {
    if (!liberada) return;
    let ativo = true;
    buscarJogadores(new URLSearchParams(chave))
      .then((r) => ativo && setResultado({ chave, jogadores: r.jogadores }))
      .catch((e: unknown) => {
        if (!ativo) return;
        if (e instanceof ApiError && e.status === 401) navigate('/', { replace: true });
        else setResultado({ chave, erro: true });
      });
    return () => {
      ativo = false;
    };
  }, [chave, liberada, navigate, tentativa]);

  function aplicar(f: Filtros) {
    setParams(paraParams(f));
    setFolhaAberta(false);
  }

  const carregando = !resultado || resultado.chave !== chave;
  const jogadores = !carregando && 'jogadores' in resultado ? resultado.jogadores : null;

  return (
    <Layout navegacao>
      <header className="flex w-full flex-col gap-4.5">
        <p className="text-xs font-bold text-destaque">BUSCAR DUO</p>
        <h1 className="text-titulo font-bold lg:text-titulo-grande">Boa companhia para a próxima partida.</h1>
        <p className="text-md text-texto-suave">
          {carregando && liberada
            ? 'Estamos buscando jogadores para você.'
            : 'Encontre pessoas com afinidade. Confira a reputação e convide sem pressão.'}
        </p>
      </header>

      {erroPerfil ? (
        <ErroCarregar onTentar={recarregar} />
      ) : !eu ? (
        <p role="status" className="w-full text-texto-suave">
          Carregando...
        </p>
      ) : !liberada ? (
        <div className="flex w-full flex-col gap-4">
          <Aviso tom="info" titulo="Complete o perfil mínimo: Riot ID e 1 horário">
            Buscar está bloqueado até você preencher esses dados. Assim, seus convites já começam com afinidade.
          </Aviso>
          <Botao className="lg:w-auto lg:self-start" onClick={() => navigate(`/perfil/${eu.proximaEtapa ?? 'jogos'}`)}>
            Completar Perfil
          </Botao>
        </div>
      ) : (
        <>
          <Aviso tom="info" titulo={`Seu perfil está pronto, ${eu.nome}`}>
            {resumoProprio(eu)}Seus contatos continuam privados até o match.
          </Aviso>

          <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
            <Cartao className="hidden w-70 shrink-0 lg:block">
              <PainelFiltros key={chave} aplicados={filtros} onAplicar={aplicar} />
            </Cartao>

            <section className="flex min-w-0 flex-1 flex-col gap-5" aria-busy={carregando}>
              <div className="flex items-center justify-between gap-3">
                {carregando ? (
                  <Indicador tom="neutro" icone={iconeCarregando}>
                    <span role="status">Carregando jogadores…</span>
                  </Indicador>
                ) : (
                  <div className="flex flex-col gap-0.75">
                    <h2 className="text-subtitulo font-bold" role="status">
                      {jogadores ? `${jogadores.length} ${jogadores.length === 1 ? 'jogador' : 'jogadores'}` : 'Busca indisponível'}
                    </h2>
                    <p className="text-xs text-texto-suave">Mais compatíveis primeiro</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="hidden lg:inline-flex">
                    <Indicador tom="neutro" icone={iconeControle}>
                      Valorant
                    </Indicador>
                  </span>
                  <Botao variante="secundario" cheio={false} className="lg:hidden" onClick={() => setFolhaAberta(true)}>
                    <Icone src={iconeFiltros} tamanho={18} colorir />
                    Filtros
                  </Botao>
                </div>
              </div>

              <FiltrosAtivos filtros={filtros} onMudar={aplicar} />

              {carregando ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <CardJogadorCarregando key={i} />
                  ))}
                </div>
              ) : !jogadores ? (
                <ErroCarregar onTentar={() => setTentativa((n) => n + 1)} />
              ) : jogadores.length === 0 ? (
                <SemResultados onLimpar={() => aplicar({})} />
              ) : (
                <ul className="grid gap-4 lg:grid-cols-2">
                  {jogadores.map((j) => (
                    <li key={j.id}>
                      <CardJogador jogador={j} />
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-texto-suave">
                {carregando
                  ? 'Um instante. Seus filtros serão mantidos.'
                  : 'A reputação aparece a partir de 3 avaliações. Antes disso, mostramos “Novo jogador”.'}
              </p>
            </section>
          </div>

          <Folha aberta={folhaAberta} titulo="Encontre seu duo" onFechar={() => setFolhaAberta(false)}>
            <PainelFiltros key={chave} aplicados={filtros} onAplicar={aplicar} />
          </Folha>
        </>
      )}
    </Layout>
  );
}

/** "Ouro · Controlador · Noite. " */
function resumoProprio(eu: RespostaPerfil): string {
  const p = eu.perfil;
  const partes = [rotulo(ELOS, p.elo), rotulo(FUNCOES, p.funcaoPrimaria), ...p.turnos.map((t) => rotulo(TURNOS, t))];
  const texto = partes.filter(Boolean).join(' · ');
  return texto ? `${texto}. ` : '';
}

/** RF18: cada filtro ativo vira um chip removível; "Limpar tudo" quando há 2 ou mais. */
function FiltrosAtivos({ filtros: f, onMudar }: { filtros: Filtros; onMudar: (f: Filtros) => void }) {
  const elo =
    f.eloMin || f.eloMax
      ? f.eloMin === f.eloMax
        ? rotulo(ELOS, f.eloMin)
        : `${f.eloMin ? rotulo(ELOS, f.eloMin) : 'Ferro'} – ${f.eloMax ? rotulo(ELOS, f.eloMax) : 'Radiante'}`
      : null;

  // Cada chip sabe como ficam os filtros sem ele (o elo mínimo e o máximo saem juntos)
  const chips: { chave: string; texto: string; semEle: Filtros }[] = [];
  if (elo) chips.push({ chave: 'elo', texto: elo, semEle: { ...f, eloMin: undefined, eloMax: undefined } });
  if (f.complementar)
    chips.push({ chave: 'complementar', texto: 'Funções complementares', semEle: { ...f, complementar: undefined } });
  if (f.turno) chips.push({ chave: 'turno', texto: rotulo(TURNOS, f.turno), semEle: { ...f, turno: undefined } });
  if (f.estilo) chips.push({ chave: 'estilo', texto: rotulo(ESTILOS, f.estilo), semEle: { ...f, estilo: undefined } });
  if (f.genero)
    chips.push({ chave: 'genero', texto: rotulo(GENEROS_FILTRO, f.genero), semEle: { ...f, genero: undefined } });

  if (chips.length === 0) return null;

  const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque';
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
      {chips.map((c) => (
        <li key={c.chave}>
          <button
            type="button"
            onClick={() => onMudar(c.semEle)}
            aria-label={`Remover filtro ${c.texto}`}
            className={`inline-flex items-center gap-1.5 rounded-full border border-transparent bg-destaque-fundo px-2.5 py-1.25 text-xs font-bold text-destaque transition-colors hover:border-destaque ${foco}`}
          >
            {c.texto}
            <span aria-hidden="true">✕</span>
          </button>
        </li>
      ))}
      {chips.length >= 2 && (
        <li>
          <button
            type="button"
            onClick={() => onMudar({})}
            className={`rounded-caixa px-1 text-xs font-bold text-texto-suave underline underline-offset-2 hover:text-texto ${foco}`}
          >
            Limpar tudo
          </button>
        </li>
      )}
    </ul>
  );
}

function SemResultados({ onLimpar }: { onLimpar: () => void }) {
  return (
    <Cartao className="flex flex-col items-center gap-5 px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destaque-fundo">
        <Icone src={iconeLupa} tamanho={28} />
      </span>
      <h3 className="text-nome font-bold">Ninguém com esses filtros agora</h3>
      <p className="text-texto-suave">Tente ampliar o elo ou escolher outro turno. Uma boa parceria pode estar logo ali.</p>
      <Botao cheio={false} onClick={onLimpar}>
        Limpar filtros
      </Botao>
    </Cartao>
  );
}

function ErroCarregar({ onTentar }: { onTentar: () => void }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <ErroConexao oQue="os jogadores" onTentar={onTentar} />
    </div>
  );
}
