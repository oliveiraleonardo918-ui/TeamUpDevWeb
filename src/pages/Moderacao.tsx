import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { AreaTexto } from '../components/Campo';
import { Cartao } from '../components/Cartao';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { buscarMe, type Me } from '../lib/api';
import { formatarData, formatarDataHora } from '../lib/datas';
import {
  arquivarDenuncia,
  banir,
  buscarPainel,
  desbanir,
  rotuloMotivo,
  type Denuncia,
  type PainelModeracao,
} from '../lib/moderacao';
import { useProtegido } from '../lib/useProtegido';

type Acao =
  | { tipo: 'banir'; denuncia: Denuncia }
  | { tipo: 'desbanir'; usuario: PainelModeracao['banidos'][number] }
  | null;

/** Painel da equipe (RF12): denúncias abertas, arquivar, banir (RN07) e, para admin, remover banimento. */
export function Moderacao() {
  const { dados, erro, recarregar } = useProtegido(buscarPainel);
  const { dados: eu } = useProtegido(buscarMe);
  const [acao, setAcao] = useState<Acao>(null);
  const [arquivando, setArquivando] = useState<string | null>(null);
  const [falha, setFalha] = useState(false);
  const admin = eu?.papel === 'admin';

  async function arquivar(d: Denuncia) {
    setArquivando(d.id);
    setFalha(false);
    try {
      await arquivarDenuncia(d.id);
    } catch {
      setFalha(true);
    } finally {
      setArquivando(null);
      recarregar();
    }
  }

  return (
    <Layout navegacao>
      <header className="flex w-full flex-col gap-4.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-destaque">ÁREA DE ADMINISTRAÇÃO</p>
          {admin && (
            <Link to="/moderacao/equipe" className="text-sm text-destaque hover:underline">
              Gerenciar equipe →
            </Link>
          )}
        </div>
        <h1 className="text-titulo font-bold lg:text-titulo-grande">Cuidar da comunidade</h1>
        <p className="text-md text-texto-suave">
          Analise cada denúncia com atenção. Respeito e segurança orientam nossas decisões.
        </p>
      </header>

      {erro ? (
        <Aviso titulo="Você não tem acesso a esta página ou ela não carregou.">
          A moderação é só para a equipe. Se você faz parte dela, verifique sua conexão e tente de novo.
        </Aviso>
      ) : !dados ? (
        <p role="status" className="w-full text-texto-suave">
          Carregando...
        </p>
      ) : (
        <>
          <ul className="grid w-full grid-cols-3 gap-3 lg:gap-4">
            <Numero valor={dados.resumo.abertas} rotulo="Abertas" />
            <Numero valor={dados.resumo.arquivadasHoje} rotulo="Arquivadas hoje" />
            <Numero valor={dados.resumo.contasSuspensas} rotulo={dados.resumo.contasSuspensas === 1 ? 'Conta suspensa' : 'Contas suspensas'} />
          </ul>

          <section className="flex w-full flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-nome font-bold">Denúncias abertas</h2>
              <p className="text-xs font-bold text-roxo">● {dados.denuncias.length} pendentes</p>
            </div>
            {falha && <Aviso titulo="Essa denúncia já foi resolvida por outra pessoa da equipe." />}
            {dados.denuncias.length === 0 ? (
              <Cartao className="text-center text-texto-suave">Nenhuma denúncia aberta. Comunidade tranquila por aqui.</Cartao>
            ) : (
              <ListaDenuncias
                denuncias={dados.denuncias}
                eu={eu}
                arquivando={arquivando}
                onArquivar={arquivar}
                onBanir={(d) => setAcao({ tipo: 'banir', denuncia: d })}
              />
            )}
          </section>

          <section className="flex w-full flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-nome font-bold">Contas suspensas</h2>
              <p className="text-xs text-texto-suave">
                {admin ? 'Revise o pedido antes de remover um banimento.' : 'Só admins podem remover banimentos.'}
              </p>
            </div>
            {dados.banidos.length === 0 ? (
              <Cartao className="text-center text-texto-suave">Nenhuma conta suspensa.</Cartao>
            ) : (
              <Cartao className="flex flex-col gap-3">
                {dados.banidos.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center gap-3 border-b border-borda pb-3 last:border-0 last:pb-0"
                  >
                    <Avatar nome={b.nome} semente={b.id} foto={b.avatarUrl} tamanho="comentario" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{b.nome}</p>
                      <p className="truncate text-xs text-texto-suave">
                        @{b.discordUsername}
                        {b.motivo && ` · ${b.motivo}`}
                      </p>
                    </div>
                    {admin && (
                      <Botao
                        variante="secundario"
                        cheio={false}
                        compacto
                        className="max-sm:w-full"
                        onClick={() => setAcao({ tipo: 'desbanir', usuario: b })}
                      >
                        Remover banimento<span className="sr-only"> de {b.nome}</span>
                      </Botao>
                    )}
                  </div>
                ))}
              </Cartao>
            )}
          </section>

          <Aviso tom="info" titulo="Proteja a identidade de quem denuncia">
            As denúncias são anônimas para o denunciado. Estes dados são visíveis apenas à equipe de moderação.
          </Aviso>
        </>
      )}

      <ConfirmarAcao
        acao={acao}
        onFechar={() => setAcao(null)}
        onFeito={() => {
          setAcao(null);
          recarregar();
        }}
      />
    </Layout>
  );
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <li className="rounded-xl border border-borda bg-superficie p-4 lg:p-6">
      <p className="text-2xl font-bold lg:text-3xl">{valor}</p>
      <p className="text-xs text-texto-suave">{rotulo}</p>
    </li>
  );
}

/** O moderador não bane outro moderador nem admin; o botão some nesses casos (o servidor também barra). */
function podeBanirNaTela(eu: Me | null, d: Denuncia): boolean {
  if (!eu || d.denunciado.id === eu.id || d.denunciado.papel === 'admin') return false;
  return d.denunciado.papel === 'jogador' || eu.papel === 'admin';
}

function ListaDenuncias({
  denuncias,
  eu,
  arquivando,
  onArquivar,
  onBanir,
}: {
  denuncias: Denuncia[];
  eu: Me | null;
  arquivando: string | null;
  onArquivar: (d: Denuncia) => void;
  onBanir: (d: Denuncia) => void;
}) {
  const navigate = useNavigate();
  // Desktop: três botões na linha. Celular: "Ver perfil" em cima, Banir e Arquivar embaixo.
  const acoes = (d: Denuncia) => (
    <div className="grid grid-cols-2 gap-2 lg:flex">
      <Botao
        variante="secundario"
        compacto
        className="col-span-2 lg:flex-1"
        onClick={() => navigate(`/jogadores/${d.denunciado.id}`)}
      >
        Ver perfil
      </Botao>
      <Botao
        variante="perigo"
        compacto
        className="lg:flex-1"
        disabled={!podeBanirNaTela(eu, d)}
        onClick={() => onBanir(d)}
      >
        Banir
      </Botao>
      <Botao
        variante="secundario"
        compacto
        className="lg:flex-1"
        disabled={arquivando !== null}
        onClick={() => onArquivar(d)}
      >
        {arquivando === d.id ? '...' : 'Arquivar'}
      </Botao>
    </div>
  );

  return (
    <>
      {/* Desktop: tabela */}
      <Cartao className="hidden lg:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-texto-suave">
            <tr className="border-b border-borda">
              <th className="pb-4 font-bold">Denunciante</th>
              <th className="pb-4 font-bold">Denunciado</th>
              <th className="pb-4 font-bold">Motivo</th>
              <th className="pb-4 font-bold">Data</th>
              <th className="pb-4 font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {denuncias.map((d) => (
              <tr key={d.id} className="border-b border-borda align-top last:border-0">
                <td className="py-5 pr-3">{d.denunciante.nome}</td>
                <td className="py-5 pr-3 font-bold">{d.denunciado.nome}</td>
                <td className="py-5 pr-3">
                  {rotuloMotivo(d.motivo)}
                  {d.descricao && <p className="mt-1 max-w-56 text-xs text-texto-suave">{d.descricao}</p>}
                </td>
                <td className="py-5 pr-3">
                  {formatarData(d.data)}
                  <p className="text-xs text-texto-suave">{formatarDataHora(d.data).split(' · ')[1]}</p>
                </td>
                <td className="w-75 py-4">{acoes(d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Cartao>

      {/* Celular: cards */}
      <ul className="flex flex-col gap-4 lg:hidden">
        {denuncias.map((d) => (
          <li key={d.id}>
            <Cartao className="flex flex-col gap-3 text-sm">
              <p>
                <span className="text-texto-suave">{d.denunciante.nome} denunciou </span>
                <strong>{d.denunciado.nome}</strong>
              </p>
              <p>
                {rotuloMotivo(d.motivo)} · <span className="text-texto-suave">{formatarDataHora(d.data)}</span>
              </p>
              {d.descricao && <p className="text-xs text-texto-suave">{d.descricao}</p>}
              {acoes(d)}
            </Cartao>
          </li>
        ))}
      </ul>
    </>
  );
}

function ConfirmarAcao({ acao, onFechar, onFeito }: { acao: Acao; onFechar: () => void; onFeito: () => void }) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(false);
  const banindo = acao?.tipo === 'banir';
  const pessoa = acao?.tipo === 'banir' ? acao.denuncia.denunciado : acao?.usuario;

  function fechar() {
    setMotivo('');
    setErro(false);
    onFechar();
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!acao || !pessoa || motivo.trim().length < 5) return;
    setEnviando(true);
    setErro(false);
    try {
      if (acao.tipo === 'banir') await banir(pessoa.id, motivo.trim(), acao.denuncia.id);
      else await desbanir(pessoa.id, motivo.trim());
      setMotivo('');
      onFeito();
    } catch {
      setErro(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal aberto={acao !== null} titulo={banindo ? 'Banir esta conta?' : 'Remover o banimento?'} onFechar={fechar}>
      {acao && pessoa && (
        <form onSubmit={confirmar} className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar nome={pessoa.nome} semente={pessoa.id} foto={pessoa.avatarUrl} tamanho="comentario" />
            <div>
              <p className="font-bold">{pessoa.nome}</p>
              {acao.tipo === 'banir' && (
                <p className="text-xs text-texto-suave">Denúncia por {rotuloMotivo(acao.denuncia.motivo)}</p>
              )}
            </div>
          </div>
          <p className="text-sm">
            {banindo
              ? 'A conta perderá acesso ao TeamUp e não poderá buscar jogadores, enviar convites ou formar novos matches. As avaliações que ela fez deixam de contar na reputação de outras pessoas.'
              : 'A conta volta a poder entrar e aparecer na busca. Use após analisar o pedido de revisão.'}
          </p>
          <AreaTexto
            rotulo={banindo ? 'Motivo do banimento (obrigatório)' : 'Motivo (obrigatório)'}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={280}
            required
            minLength={5}
            ajuda="Vai para o histórico da equipe. Mínimo de 5 caracteres."
          />
          {banindo && (
            <Aviso titulo="Revise antes de confirmar">
              Use o banimento apenas após analisar a denúncia e o perfil do jogador.
            </Aviso>
          )}
          {erro && <Aviso titulo="Não foi possível concluir. A situação pode ter mudado; atualize e tente de novo." />}
          <div className="flex gap-3">
            <Botao variante="secundario" className="flex-1" onClick={fechar}>
              Cancelar
            </Botao>
            <Botao
              type="submit"
              variante={banindo ? 'perigo' : 'primario'}
              className="flex-1"
              disabled={enviando || motivo.trim().length < 5}
            >
              {enviando ? 'Salvando...' : banindo ? 'Confirmar banimento' : 'Remover banimento'}
            </Botao>
          </div>
        </form>
      )}
    </Modal>
  );
}
