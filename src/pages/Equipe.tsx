import { useEffect, useState, type FormEvent } from 'react';
import { Avatar } from '../components/Avatar';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { AreaTexto, Campo } from '../components/Campo';
import { Cartao } from '../components/Cartao';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { formatarDataHora } from '../lib/datas';
import {
  buscarCandidatos,
  buscarEquipe,
  promoverModerador,
  removerModerador,
  TEXTO_ACAO,
  type MembroEquipe,
  type RegistroModeracao,
} from '../lib/equipe';
import { useProtegido } from '../lib/useProtegido';

type Pendente = { tipo: 'promover' | 'remover'; membro: MembroEquipe } | null;

/** Equipe de moderação (só admin): admins pela configuração, moderadores por aqui, tudo registrado. */
export function Equipe() {
  const { dados, erro, recarregar } = useProtegido(buscarEquipe);
  const [pendente, setPendente] = useState<Pendente>(null);

  return (
    <Layout navegacao>
      <header className="flex w-full flex-col gap-4.5">
        <p className="text-xs font-bold text-destaque">ÁREA DE ADMINISTRAÇÃO</p>
        <h1 className="text-titulo font-bold lg:text-titulo-grande">Equipe de moderação</h1>
        <p className="text-md text-texto-suave">Quem cuida da comunidade. Toda mudança fica registrada.</p>
      </header>

      {erro ? (
        <Aviso titulo="Você não tem acesso a esta página ou ela não carregou.">
          A página Equipe é só para admins. Se você é admin, verifique sua conexão e tente de novo.
        </Aviso>
      ) : !dados ? (
        <p role="status" className="w-full text-texto-suave">
          Carregando...
        </p>
      ) : (
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <Cartao className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">Moderadores</h2>
              {dados.moderadores.length === 0 ? (
                <p className="text-sm text-texto-suave">Ninguém ainda. Adicione alguém de confiança abaixo.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {dados.moderadores.map((m) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <Membro m={m} detalhe={m.banido ? 'Conta banida' : undefined} />
                      <Botao
                        variante="secundario"
                        cheio={false}
                        compacto
                        onClick={() => setPendente({ tipo: 'remover', membro: m })}
                      >
                        Remover<span className="sr-only"> {m.nome} da moderação</span>
                      </Botao>
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>

            <AdicionarModerador onEscolher={(m) => setPendente({ tipo: 'promover', membro: m })} />

            <Cartao className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">Histórico</h2>
              <Historico itens={dados.historico} />
            </Cartao>
          </div>

          <div className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
            <Cartao className="flex flex-col gap-4">
              <h2 className="text-xl font-bold">Admins</h2>
              <ul className="flex flex-col gap-3">
                {dados.admins.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <Membro m={a} />
                  </li>
                ))}
              </ul>
              {dados.adminsSemConta > 0 && (
                <p className="text-xs text-texto-suave">
                  {dados.adminsSemConta} admin(s) configurado(s) ainda não entrou(aram) no TeamUp.
                </p>
              )}
            </Cartao>
            <Aviso tom="info" titulo="Admins são definidos na configuração">
              Para adicionar ou remover um admin, abra um PR alterando ADMIN_DISCORD_IDS no wrangler.jsonc. O passo a
              passo está no README.
            </Aviso>
          </div>
        </div>
      )}

      <ConfirmarMudanca
        pendente={pendente}
        onFechar={() => setPendente(null)}
        onFeito={() => {
          setPendente(null);
          recarregar();
        }}
      />
    </Layout>
  );
}

function Membro({ m, detalhe }: { m: MembroEquipe; detalhe?: string }) {
  return (
    <>
      <Avatar nome={m.nome} semente={m.id} tamanho="comentario" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{m.nome}</p>
        <p className="truncate text-xs text-texto-suave">
          @{m.discordUsername}
          {detalhe && ` · ${detalhe}`}
        </p>
      </div>
    </>
  );
}

function AdicionarModerador({ onEscolher }: { onEscolher: (m: MembroEquipe) => void }) {
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState<{ q: string; lista: MembroEquipe[] } | null>(null);
  const termo = busca.trim();

  // Busca com espera de 300 ms depois da última tecla
  useEffect(() => {
    if (termo.length < 2) return;
    let ativo = true;
    const t = setTimeout(() => {
      buscarCandidatos(termo)
        .then((r) => ativo && setResultado({ q: termo, lista: r.candidatos }))
        .catch(() => ativo && setResultado({ q: termo, lista: [] }));
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [termo]);

  const lista = termo.length >= 2 && resultado?.q === termo ? resultado.lista : null;

  return (
    <Cartao className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Adicionar moderador</h2>
      <Campo
        rotulo="Buscar jogador"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Nome ou usuário do Discord"
        maxLength={32}
        autoComplete="off"
        ajuda="Digite pelo menos 2 letras. Admins, moderadores e contas banidas não aparecem."
      />
      {lista && (
        <ul className="flex flex-col gap-3" aria-live="polite">
          {lista.length === 0 ? (
            <li className="text-sm text-texto-suave">Nenhum jogador encontrado.</li>
          ) : (
            lista.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <Membro m={m} />
                <Botao cheio={false} compacto onClick={() => onEscolher(m)}>
                  Promover<span className="sr-only"> {m.nome}</span>
                </Botao>
              </li>
            ))
          )}
        </ul>
      )}
    </Cartao>
  );
}

function ConfirmarMudanca({
  pendente,
  onFechar,
  onFeito,
}: {
  pendente: Pendente;
  onFechar: () => void;
  onFeito: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(false);
  const promover = pendente?.tipo === 'promover';

  function fechar() {
    setMotivo('');
    setErro(false);
    onFechar();
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!pendente) return;
    setEnviando(true);
    setErro(false);
    try {
      await (promover ? promoverModerador : removerModerador)(pendente.membro.id, motivo.trim());
      setMotivo('');
      onFeito();
    } catch {
      setErro(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      aberto={pendente !== null}
      titulo={promover ? 'Promover a moderador?' : 'Remover da moderação?'}
      onFechar={fechar}
    >
      {pendente && (
        <form onSubmit={confirmar} className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Membro m={pendente.membro} />
          </div>
          <p className="text-sm">
            {promover
              ? 'Essa pessoa poderá ver as denúncias, arquivar e banir jogadores. Ela não poderá mexer na equipe.'
              : 'Essa pessoa volta a ser jogadora e perde o acesso às denúncias na hora.'}
          </p>
          <AreaTexto
            rotulo="Motivo (opcional, vai para o histórico)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={280}
          />
          {erro && <Aviso titulo="Não foi possível concluir. A lista pode ter mudado; tente de novo." />}
          <div className="flex gap-3">
            <Botao variante="secundario" className="flex-1" onClick={fechar}>
              Cancelar
            </Botao>
            <Botao type="submit" className="flex-1" disabled={enviando}>
              {enviando ? 'Salvando...' : promover ? 'Promover' : 'Remover'}
            </Botao>
          </div>
        </form>
      )}
    </Modal>
  );
}

function Historico({ itens }: { itens: RegistroModeracao[] }) {
  if (itens.length === 0) return <p className="text-sm text-texto-suave">Nenhuma ação registrada ainda.</p>;
  return (
    <ol className="flex flex-col gap-3">
      {itens.map((h) => (
        <li key={h.id} className="border-b border-borda pb-3 text-sm last:border-0 last:pb-0">
          <p>
            <strong>{h.autor ?? 'Conta removida'}</strong> {TEXTO_ACAO[h.acao][0]}{' '}
            <strong>{h.alvo ?? 'conta removida'}</strong> {TEXTO_ACAO[h.acao][1]}
          </p>
          <p className="text-xs text-texto-suave">
            {formatarDataHora(h.data)}
            {h.motivo && ` · Motivo: ${h.motivo}`}
          </p>
        </li>
      ))}
    </ol>
  );
}
