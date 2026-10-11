import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError } from '../lib/api';
import {
  denunciar,
  EVIDENCIA_MAX_BYTES,
  EVIDENCIAS_MAX,
  MENSAGENS_DENUNCIA,
  MOTIVOS,
  TIPOS_EVIDENCIA,
  type Motivo,
} from '../lib/moderacao';
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
  const [arquivos, setArquivos] = useState<File[]>([]);

  function fechar() {
    setMotivo(null);
    setDescricao('');
    setArquivos([]);
    setErro(null);
    setEnviada(false);
    onFechar();
  }

  /** Valida no navegador o que o servidor também confere (quantidade, tamanho e tipo). */
  function escolher(e: ChangeEvent<HTMLInputElement>) {
    const novos = [...arquivos, ...Array.from(e.target.files ?? [])];
    e.target.value = '';
    if (novos.length > EVIDENCIAS_MAX) return setErro(MENSAGENS_DENUNCIA.muitas_evidencias);
    if (novos.some((a) => a.size > EVIDENCIA_MAX_BYTES)) return setErro(MENSAGENS_DENUNCIA.evidencia_grande);
    if (novos.some((a) => !TIPOS_EVIDENCIA.includes(a.type))) return setErro(MENSAGENS_DENUNCIA.evidencia_tipo);
    setErro(null);
    setArquivos(novos);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!motivo) return;
    setEnviando(true);
    setErro(null);
    try {
      await denunciar(jogador.id, motivo, descricao.trim(), arquivos);
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
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold">Evidências (opcional)</p>
            {arquivos.length > 0 && (
              <ul className="flex flex-col gap-2">
                {arquivos.map((a, i) => (
                  <li key={`${a.name}-${i}`} className="flex items-center gap-3 rounded-lg bg-fundo px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="text-xs text-texto-suave">{Math.ceil(a.size / 1024)} KB</span>
                    <button
                      type="button"
                      onClick={() => setArquivos(arquivos.filter((_, j) => j !== i))}
                      className="rounded-caixa text-xs font-bold text-perigo hover:underline focus-visible:outline-2 focus-visible:outline-perigo"
                    >
                      Remover<span className="sr-only"> {a.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {arquivos.length < EVIDENCIAS_MAX && (
              <label className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-dashed border-borda text-sm font-bold text-texto-suave hover:border-texto-suave hover:text-texto has-focus-visible:outline-2 has-focus-visible:outline-destaque">
                Anexar imagem
                <input type="file" accept={TIPOS_EVIDENCIA.join(',')} multiple onChange={escolher} className="sr-only" />
              </label>
            )}
            <p className="text-xs text-texto-suave">
              Até {EVIDENCIAS_MAX} imagens (PNG, JPG ou WebP) de até 1 MB cada. Só a equipe de moderação vê.
            </p>
          </div>
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
