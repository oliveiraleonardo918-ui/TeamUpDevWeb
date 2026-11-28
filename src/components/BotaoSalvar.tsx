import { useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import { buscarSalvos, MENSAGENS_SALVOS, removerSalvo, salvarJogador } from '../lib/salvos';
import { Aviso } from './Aviso';
import { Botao } from './Botao';

/**
 * RF15: salvar o jogador para ver depois. Clicar de novo remove dos salvos.
 * Descobre se já está salvo olhando a própria lista (GET /api/salvos), sem mexer na API de jogadores.
 */
export function BotaoSalvar({ jogadorId }: { jogadorId: string }) {
  // null = ainda carregando
  const [salvo, setSalvo] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarSalvos()
      .then((r) => ativo && setSalvo(r.jogadores.some((j) => j.id === jogadorId)))
      .catch(() => ativo && setSalvo(false));
    return () => {
      ativo = false;
    };
  }, [jogadorId]);

  async function alternar() {
    setOcupado(true);
    setErro(null);
    try {
      if (salvo) await removerSalvo(jogadorId);
      else await salvarJogador(jogadorId);
      setSalvo(!salvo);
    } catch (e) {
      setErro(
        (e instanceof ApiError && MENSAGENS_SALVOS[e.message]) || 'Não foi possível atualizar seus salvos. Tente de novo.',
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Botao variante="secundario" onClick={alternar} disabled={salvo === null || ocupado} aria-pressed={salvo ?? false}>
        {salvo ? 'Salvo ✓' : 'Salvar para depois'}
      </Botao>
      {erro && <Aviso titulo={erro} />}
    </>
  );
}