import { Link, useNavigate } from 'react-router';
import iconeSeta from '../assets/icons/arrow-right.svg';
import iconeCadeado from '../assets/icons/lock-keyhole-suave.svg';
import { Avatar } from '../components/Avatar';
import { Aviso } from '../components/Aviso';
import { BarraProgresso } from '../components/BarraProgresso';
import { Botao } from '../components/Botao';
import { Cartao } from '../components/Cartao';
import { Icone } from '../components/Icone';
import { Layout } from '../components/Layout';
import { sair } from '../lib/api';
import { buscarPerfil, ETAPAS, NOMES_ETAPAS, type Etapa, type RespostaPerfil } from '../lib/perfil';
import { useProtegido } from '../lib/useProtegido';

const SALVO: Record<Etapa, string> = {
  jogos: 'Riot ID',
  nivel: 'nível',
  horarios: 'horários',
  estilo: 'estilo de jogo',
};

const PROXIMO_PASSO: Record<Etapa, string> = {
  jogos: 'informar seu Riot ID',
  nivel: 'definir seu nível',
  horarios: 'definir seus horários',
  estilo: 'contar seu estilo de jogo',
};

function iniciais(nome: string): string {
  return nome.trim().slice(0, 2).toUpperCase();
}

function listar(itens: string[]): string {
  return itens.length < 2 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`;
}

function textos(d: RespostaPerfil) {
  const feitas = ETAPAS.filter((e) => d.etapas[e]);
  if (feitas.length === 0) {
    return {
      titulo: 'Complete seu perfil para começar',
      saudacao: `Oi, ${d.nome}! Vamos conhecer seu jeito de jogar?`,
      resumo: 'Seu perfil ainda está vazio. Leva só alguns minutos para deixar tudo pronto.',
      acao: 'Criar Perfil',
    };
  }
  if (d.proximaEtapa) {
    const salvos = listar(feitas.map((e, i) => (i === 0 ? SALVO[e].charAt(0).toUpperCase() + SALVO[e].slice(1) : SALVO[e])));
    return {
      titulo: 'Complete seu perfil para começar',
      saudacao: `Você já começou, ${d.nome}. Falta pouco para encontrar seu duo.`,
      resumo: `${salvos} ${feitas.length > 1 ? 'salvos' : 'salvo'}. A próxima etapa é ${PROXIMO_PASSO[d.proximaEtapa]}.`,
      acao: 'Completar Perfil',
    };
  }
  return {
    titulo: 'Seu perfil está pronto',
    saudacao: `Tudo certo, ${d.nome}. Agora é só encontrar seu duo.`,
    resumo: 'Você pode editar suas informações quando quiser.',
    acao: 'Editar Perfil',
  };
}

/** Área do Jogador: checklist do perfil gamer (RF03, US02) e bloqueio da busca (RN01). */
export function AreaJogador() {
  const { dados, erro, recarregar } = useProtegido(buscarPerfil);
  const navigate = useNavigate();

  async function sairDaConta() {
    await sair().catch(() => undefined);
    navigate('/', { replace: true });
  }

  if (erro) {
    return (
      <Layout navegacao>
        <div className="flex w-full max-w-160 flex-col gap-4 pt-8">
          <Aviso titulo="Não foi possível carregar seu perfil.">Verifique sua conexão e tente de novo.</Aviso>
          <Botao variante="secundario" onClick={recarregar}>
            Tentar de novo
          </Botao>
        </div>
      </Layout>
    );
  }

  if (!dados) {
    return (
      <Layout navegacao>
        <p role="status" className="pt-8 text-texto-suave">
          Carregando...
        </p>
      </Layout>
    );
  }

  const t = textos(dados);
  const feitas = ETAPAS.filter((e) => dados.etapas[e]).length;
  const progresso = feitas * 25;
  const completo = dados.proximaEtapa === null;

  return (
    <Layout navegacao>
      <header className="flex w-full flex-col gap-4.5">
        <p className="text-xs font-bold text-destaque">ÁREA DO JOGADOR</p>
        <h1 className="text-titulo font-bold lg:text-titulo-grande">{t.titulo}</h1>
        <p className="text-md text-texto-suave">{t.saudacao}</p>
      </header>

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
        <Cartao className="flex flex-col gap-6 lg:w-92 lg:shrink-0">
          <div className="flex items-center gap-3">
            <Avatar iniciais={iniciais(dados.nome)} tamanho="perfil" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-nome font-bold">{dados.nome}</p>
              <p className="text-sm text-texto-suave">Conta do Discord conectada</p>
            </div>
          </div>
          <p className={`text-xs font-bold ${completo ? 'text-destaque' : 'text-texto-suave'}`}>
            ● {completo ? 'Perfil completo' : 'Perfil incompleto'}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-texto-suave">Seu progresso</p>
            <p className="text-subtitulo font-bold text-destaque">{progresso}%</p>
          </div>
          <BarraProgresso valor={progresso} rotulo="Progresso do perfil" />
          <p className="text-texto-suave">{t.resumo}</p>
          <Botao onClick={() => navigate(`/perfil/${dados.proximaEtapa ?? 'jogos'}`)}>
            <Icone src={iconeSeta} tamanho={18} />
            {t.acao}
          </Botao>
          <button
            type="button"
            onClick={sairDaConta}
            className="self-center rounded-caixa text-sm text-texto-suave hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
          >
            Sair da conta
          </button>
        </Cartao>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Cartao className="flex flex-col gap-5">
            <h2 className="text-xl font-bold">Seu perfil, em quatro passos</h2>
            <ol className="flex flex-col gap-5">
              {ETAPAS.map((e) => {
                const feita = dados.etapas[e];
                const status = feita
                  ? 'Concluído'
                  : e === dados.proximaEtapa && feitas > 0
                    ? 'Pendente · próxima etapa'
                    : 'Ainda não preenchido';
                return (
                  <li key={e}>
                    <Link
                      to={`/perfil/${e}`}
                      className="group block rounded-caixa focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-destaque"
                    >
                      <span className="text-md leading-relaxed font-bold group-hover:underline">
                        <span aria-hidden="true" className={feita ? 'text-destaque' : 'text-texto-suave'}>
                          {feita ? '✓' : '○'}
                          {'  '}
                        </span>
                        {NOMES_ETAPAS[e]}
                      </span>
                      <span className={`block text-xs leading-relaxed ${feita ? 'text-destaque' : 'text-texto-suave'}`}>
                        {status}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Cartao>

          {dados.buscaLiberada ? (
            <Aviso tom="info" titulo="Perfil mínimo completo">
              A busca de duos já está liberada para você e chega na próxima atualização do TeamUp.
            </Aviso>
          ) : (
            <>
              <Aviso tom="info" titulo="Complete o perfil mínimo: Riot ID e 1 horário">
                Buscar está bloqueado até você preencher esses dados. Assim, seus convites já começam com afinidade.
              </Aviso>
              <Botao variante="secundario" disabled className="text-texto-suave disabled:opacity-100">
                <Icone src={iconeCadeado} tamanho={18} />
                Buscar bloqueado
              </Botao>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
