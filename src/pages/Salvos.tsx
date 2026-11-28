import { useState } from 'react';
import { Link } from 'react-router';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { CardJogador } from '../components/CardJogador';
import { Cartao } from '../components/Cartao';
import { ErroConexao } from '../components/ErroConexao';
import { Layout } from '../components/Layout';
import { buscarSalvos, MAX_SALVOS, removerSalvo } from '../lib/salvos';
import { useProtegido } from '../lib/useProtegido';

/** Jogadores salvos (RF15): lista privada para ver depois (RN10). Sem Riot ID nem Discord (RN02). */
export function Salvos() {
  const { dados, erro, recarregar } = useProtegido(buscarSalvos);
  // Removidos nesta visita somem na hora, sem recarregar a lista
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);

  async function remover(id: string) {
    setRemovendo(id);
    setFalhou(false);
    try {
      await removerSalvo(id);
      setRemovidos((r) => [...r, id]);
    } catch {
      setFalhou(true);
    } finally {
      setRemovendo(null);
    }
  }

  const jogadores = dados ? dados.jogadores.filter((j) => !removidos.includes(j.id)) : null;

  return (
    <Layout navegacao menuAtivo="/jogador">
      <header className="flex w-full flex-col gap-4.5">
        <p className="text-xs font-bold text-destaque">JOGADORES SALVOS</p>
        <h1 className="text-titulo font-bold lg:text-titulo-grande">Quem você quer ver de novo.</h1>
        <p className="text-md text-texto-suave">Só você vê esta lista. Ninguém é avisado quando você salva alguém.</p>
      </header>

      {erro ? (
        <div className="flex w-full flex-col gap-4">
          <ErroConexao oQue="seus jogadores salvos" onTentar={recarregar} />
        </div>
      ) : !jogadores ? (
        <p role="status" className="w-full text-texto-suave">
          Carregando...
        </p>
      ) : jogadores.length === 0 ? (
        <Cartao className="flex w-full flex-col items-center gap-5 px-6 py-12 text-center">
          <h2 className="text-nome font-bold">Você ainda não salvou ninguém</h2>
          <p className="text-texto-suave">Na busca, abra um perfil e toque em “Salvar para depois”.</p>
          <Link to="/buscar" className="font-bold text-destaque hover:underline">
            Ir para Buscar
          </Link>
        </Cartao>
      ) : (
        <section className="flex w-full flex-col gap-5">
          <p className="text-sm text-texto-suave" role="status">
            {jogadores.length} de {MAX_SALVOS} jogadores salvos
          </p>
          {falhou && <Aviso titulo="Não foi possível remover. Tente de novo." />}
          <ul className="grid gap-4 lg:grid-cols-2">
            {jogadores.map((j) => (
              <li key={j.id} className="flex flex-col gap-2">
                <CardJogador jogador={j} />
                <Botao variante="secundario" compacto disabled={removendo === j.id} onClick={() => remover(j.id)}>
                  {removendo === j.id ? 'Removendo...' : 'Remover'}
                  <span className="sr-only"> {j.nome} dos salvos</span>
                </Botao>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Layout>
  );
}