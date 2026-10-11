import { useState, type FormEvent } from 'react';
import { ApiError } from '../lib/api';
import { denunciar, MENSAGENS_DENUNCIA, MOTIVOS, type Motivo } from '../lib/moderacao';
import { Aviso } from './Aviso';
import { Botao } from './Botao';
import { AreaTexto } from './Campo';
import { Modal } from './Modal';

/** "Denunciar jogador" (RF11). A identidade de quem denuncia não aparece para o denunciado. */
export function ModalDenuncia({
  aberto,
  jogador,
  onFechar,
}: {
  aberto: boolean;
  jogador: { id: string; nome: string };
  onFechar: () => void;
}) {
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);

  function fechar() {
    setMotivo(null);
    setDescricao('');
    setErro(null);
    setEnviada(false);
    onFechar();
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!motivo) return;
    setEnviando(true);
    setErro(null);
    try {
      await denunciar(jogador.id, motivo, descricao.trim());
      setEnviada(true);
    } catch (err) {
      setErro((err instanceof ApiError && MENSAGENS_DENUNCIA[err.message]) || 'Não foi possível enviar. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal aberto={aberto} titulo="Denunciar jogador" onFechar={fechar}>
      {enviada ? (
        <div className="flex flex-col gap-5">
          <Aviso tom="info" titulo="Denúncia enviada">
            Obrigado por avisar. A equipe de moderação vai analisar com cuidado.
          </Aviso>
          <Botao onClick={fechar}>Fechar</Botao>
        </div>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-5">
          <p className="-mt-3 text-sm text-texto-suave">Perfil de {jogador.nome}</p>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-bold">O que aconteceu?</legend>
            {MOTIVOS.map((m) => (
              <label key={m.valor} className="flex cursor-pointer items-center gap-2.5 text-base">
                <input
                  type="radio"
                  name="motivo"
                  value={m.valor}
                  checked={motivo === m.valor}
                  onChange={() => setMotivo(m.valor)}
                  className="size-4 cursor-pointer accent-destaque"
                />
                {m.rotulo}
              </label>
            ))}
          </fieldset>
          <AreaTexto
            rotulo="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            maxLength={500}
            placeholder="Escreva o que aconteceu na partida…"
            ajuda={`${descricao.length}/500 caracteres`}
          />
          <Aviso tom="info" titulo="Sua denúncia é anônima para o denunciado" />
          {erro && <Aviso titulo={erro} />}
          <div className="flex gap-3">
            <Botao variante="secundario" className="flex-1" onClick={fechar}>
              Cancelar
            </Botao>
            <Botao type="submit" variante="perigo" className="flex-1" disabled={!motivo || enviando}>
              {enviando ? 'Enviando...' : 'Enviar denúncia'}
            </Botao>
          </div>
        </form>
      )}
    </Modal>
  );
}
