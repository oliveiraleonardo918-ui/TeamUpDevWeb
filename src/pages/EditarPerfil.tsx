import { useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import iconeSeta from '../assets/icons/arrow-right.svg';
import iconeCheck from '../assets/icons/circle-check.svg';
import iconeControle from '../assets/icons/gamepad-2.svg';
import { AreaTexto, Campo } from '../components/Campo';
import { Aviso } from '../components/Aviso';
import { BarraProgresso } from '../components/BarraProgresso';
import { Botao } from '../components/Botao';
import { Icone } from '../components/Icone';
import { Interruptor } from '../components/Interruptor';
import { ErroConexao } from '../components/ErroConexao';
import { Layout } from '../components/Layout';
import { Opcoes } from '../components/Opcoes';
import {
  buscarPerfil,
  ELOS,
  ESTILOS,
  ETAPAS,
  FUNCOES,
  GENEROS,
  NOMES_ETAPAS,
  salvarEtapa,
  TURNOS,
  type Etapa,
  type Perfil,
} from '../lib/perfil';
import { useProtegido } from '../lib/useProtegido';

const SUBTITULOS: Record<Etapa, string> = {
  jogos: 'Escolha seu jogo e conecte sua identidade na partida.',
  nivel: 'Seu elo e suas funções ajudam a encontrar uma boa combinação.',
  horarios: 'Quando você costuma jogar? Pode escolher mais de um turno.',
  estilo: 'Conte como você gosta de jogar. Aqui, respeito vem antes do resultado.',
};

// Mesmo formato validado no servidor (worker/rules.ts, riotIdValido)
const RIOT_ID = /^[^#]{3,16}#[A-Za-z0-9]{3,5}$/u;
const BIO_MAX = 160;

function ehEtapa(valor: string | undefined): valor is Etapa {
  return (ETAPAS as readonly string[]).includes(valor ?? '');
}

/** Onboarding do perfil gamer em 4 etapas (RF02, RF04). Cada "Avançar" salva a etapa. */
export function EditarPerfil() {
  const { etapa } = useParams();
  const { dados, erro, recarregar } = useProtegido(buscarPerfil);

  if (!ehEtapa(etapa)) return <Navigate to="/jogador" replace />;

  return (
    <Layout navegacao>
      <div className="w-full max-w-192">
        {erro ? (
          <div className="flex flex-col gap-4">
            <ErroConexao oQue="seu perfil" onTentar={recarregar} />
          </div>
        ) : dados ? (
          // key: ao trocar de etapa, o formulário recomeça com os dados salvos
          <FormularioEtapa key={etapa} etapa={etapa} perfil={dados.perfil} />
        ) : (
          <p role="status" className="text-center text-texto-suave">
            Carregando...
          </p>
        )}
      </div>
    </Layout>
  );
}

function FormularioEtapa({ etapa, perfil }: { etapa: Etapa; perfil: Perfil }) {
  const navigate = useNavigate();
  const indice = ETAPAS.indexOf(etapa);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [riotId, setRiotId] = useState(perfil.riotId ?? '');
  const [elo, setElo] = useState(perfil.elo);
  const [funcaoPrimaria, setFuncaoPrimaria] = useState(perfil.funcaoPrimaria);
  const [funcaoSecundaria, setFuncaoSecundaria] = useState(perfil.funcaoSecundaria);
  const [turnos, setTurnos] = useState(perfil.turnos);
  const [disponivel, setDisponivel] = useState(perfil.disponivel);
  const [estilo, setEstilo] = useState(perfil.estilo);
  const [bio, setBio] = useState(perfil.bio ?? '');
  const [genero, setGenero] = useState(perfil.genero);
  const [generoVisivel, setGeneroVisivel] = useState(perfil.generoVisivel);

  const generoDeclarado = genero !== null && genero !== 'nao_informar';
  const erroRiotId = riotId.trim() && !RIOT_ID.test(riotId.trim()) ? 'Use o formato Nome#TAG, por exemplo Marina#BR1.' : undefined;

  /** Valida no cliente e devolve a chamada de salvamento da etapa (ou uma mensagem de erro). */
  function preparar(): (() => Promise<unknown>) | string {
    switch (etapa) {
      case 'jogos':
        if (!RIOT_ID.test(riotId.trim())) return 'Informe seu Riot ID no formato Nome#TAG.';
        return () => salvarEtapa.jogos({ riotId: riotId.trim() });
      case 'nivel':
        if (!elo || !funcaoPrimaria || !funcaoSecundaria) return 'Escolha seu elo, uma função primária e uma secundária.';
        if (funcaoPrimaria === funcaoSecundaria) return 'A função secundária precisa ser diferente da primária.';
        return () => salvarEtapa.nivel({ elo, funcaoPrimaria, funcaoSecundaria });
      case 'horarios':
        if (turnos.length === 0) return 'Selecione ao menos 1 horário.';
        return () => salvarEtapa.horarios({ turnos, disponivel });
      case 'estilo':
        if (!estilo) return 'Escolha seu estilo de jogo.';
        return () =>
          salvarEtapa.estilo({ estilo, bio: bio.trim(), genero, generoVisivel: generoDeclarado && generoVisivel });
    }
  }

  async function avancar(e: FormEvent) {
    e.preventDefault();
    const salvar = preparar();
    if (typeof salvar === 'string') {
      setErro(salvar);
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await salvar();
      navigate(indice < ETAPAS.length - 1 ? `/perfil/${ETAPAS[indice + 1]}` : '/jogador');
    } catch {
      setErro('Não foi possível salvar agora. Tente de novo.');
      setEnviando(false);
    }
  }

  function voltar() {
    navigate(indice > 0 ? `/perfil/${ETAPAS[indice - 1]}` : '/jogador');
  }

  const progresso = (indice + 1) * 25;
  let campos: ReactNode;

  switch (etapa) {
    case 'jogos':
      campos = (
        <>
          <div className="flex flex-col gap-6">
            <p className="text-sm font-bold">Seu jogo</p>
            <div className="flex items-center gap-3.5 rounded-xl border border-destaque bg-destaque-fundo p-5">
              <Icone src={iconeControle} tamanho={28} />
              <p className="flex-1 text-subtitulo font-bold">Valorant</p>
              <Icone src={iconeCheck} tamanho={20} rotulo="Selecionado" />
            </div>
          </div>
          <Campo
            rotulo="Riot ID"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="Nome#TAG"
            maxLength={22}
            autoComplete="off"
            required
            erro={erroRiotId}
            ajuda="Formato: Nome#TAG. Obrigatório para buscar duos."
          />
          <Aviso tom="info" titulo="Seu Riot ID é privado">
            Ele só será compartilhado quando você e seu duo aceitarem o convite.
          </Aviso>
          <p className="text-xs text-texto-suave">
            Sua conta do Discord já está conectada. Você não precisa informar senha de jogo.
          </p>
        </>
      );
      break;
    case 'nivel':
      campos = (
        <>
          <Opcoes legenda="Seu elo atual" nome="elo" opcoes={ELOS} valor={elo} onChange={setElo} />
          <Opcoes
            legenda="Função primária"
            nome="funcao-primaria"
            variante="pilula"
            opcoes={FUNCOES}
            valor={funcaoPrimaria}
            onChange={setFuncaoPrimaria}
          />
          <Opcoes
            legenda="Função secundária"
            nome="funcao-secundaria"
            variante="pilula"
            opcoes={FUNCOES}
            valor={funcaoSecundaria}
            onChange={setFuncaoSecundaria}
          />
          <p className="text-sm text-texto-suave">
            Escolha uma função principal e uma secundária diferente. Você pode mudar depois no perfil.
          </p>
        </>
      );
      break;
    case 'horarios':
      campos = (
        <>
          <Opcoes
            legenda="Seus turnos"
            nome="turnos"
            opcoes={TURNOS}
            multipla
            valor={turnos}
            onChange={setTurnos}
            ajuda="Selecione ao menos 1 horário para liberar a busca."
          />
          <hr className="border-borda" />
          <Interruptor
            titulo="Disponível agora"
            descricao="Mostre que você está pronto para uma partida."
            ligado={disponivel}
            onChange={setDisponivel}
          />
          <Aviso tom="info" titulo="No seu ritmo">
            Não precisa estar online o tempo todo. Seu horário ajuda a encontrar quem joga na mesma hora.
          </Aviso>
        </>
      );
      break;
    case 'estilo':
      campos = (
        <>
          <Opcoes legenda="Estilo de jogo" nome="estilo" opcoes={ESTILOS} valor={estilo} onChange={setEstilo} />
          <AreaTexto
            rotulo="Sua bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={BIO_MAX}
            placeholder="Conte um pouco sobre como você gosta de jogar."
            ajuda={`${bio.length}/${BIO_MAX} caracteres`}
          />
          <Opcoes legenda="Gênero (opcional)" nome="genero" opcoes={GENEROS} valor={genero} onChange={setGenero} />
          {generoDeclarado && (
            <Interruptor
              titulo="Mostrar meu gênero e aparecer no filtro por gênero"
              descricao="Essa escolha é opcional e pode ser alterada a qualquer momento."
              ligado={generoVisivel}
              onChange={setGeneroVisivel}
            />
          )}
          <p className="text-xs text-texto-suave">Só quem autorizar a exibição aparece no filtro por gênero.</p>
        </>
      );
      break;
  }

  return (
    <form onSubmit={avancar} noValidate className="flex flex-col gap-6 rounded-xl bg-superficie p-6 lg:p-8">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-texto-suave">
          Etapa {indice + 1} de {ETAPAS.length} <span className="text-destaque">· {progresso}%</span>
        </p>
        <BarraProgresso valor={progresso} rotulo="Progresso das etapas" fina />
      </div>
      <div className="flex flex-col gap-5">
        <h1 className="text-titulo font-bold">{NOMES_ETAPAS[etapa]}</h1>
        <p className="text-md text-texto-suave">{SUBTITULOS[etapa]}</p>
      </div>

      {campos}

      {erro && <Aviso titulo={erro} />}
      <hr className="border-borda" />
      <div className="flex gap-3">
        <Botao variante="secundario" onClick={voltar} className="flex-1">
          Voltar
        </Botao>
        <Botao type="submit" disabled={enviando} className="flex-1">
          <Icone src={iconeSeta} tamanho={18} />
          {enviando ? 'Salvando...' : 'Avançar'}
        </Botao>
      </div>
      {etapa === 'estilo' && (
        <p className="text-center text-xs text-texto-suave">Ao avançar, seu perfil fica pronto para buscar duos.</p>
      )}
    </form>
  );
}
