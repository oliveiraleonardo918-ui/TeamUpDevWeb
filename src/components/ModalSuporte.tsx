import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../lib/api';
import { EMAIL_SUPORTE } from '../lib/config';
import { Aviso } from './Aviso';
import { Botao } from './Botao';
import { AreaTexto, Campo } from './Campo';
import { Modal } from './Modal';

const MENSAGEM_MAX = 2000;

type Estado = { tipo: 'editando' } | { tipo: 'enviado'; protocolo?: string } | { tipo: 'erro'; codigo: string };

/** Formulário de suporte dentro do site: o servidor envia o e-mail, sem abrir Outlook/Gmail. */
export function ModalSuporte({
  aberto,
  onFechar,
  assuntoInicial = '',
}: {
  aberto: boolean;
  onFechar: () => void;
  assuntoInicial?: string;
}) {
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState(assuntoInicial);
  const [mensagem, setMensagem] = useState('');
  const [armadilha, setArmadilha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' });

  function fechar() {
    if (estado.tipo === 'enviado') {
      setAssunto(assuntoInicial);
      setMensagem('');
    }
    setEstado({ tipo: 'editando' });
    onFechar();
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await api.post<{ enviado: boolean; protocolo?: string }>('/suporte', {
        email: email.trim(),
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        site: armadilha,
      });
      setEstado({ tipo: 'enviado', protocolo: r.protocolo });
    } catch (err) {
      setEstado({ tipo: 'erro', codigo: err instanceof ApiError ? err.message : 'falha' });
    } finally {
      setEnviando(false);
    }
  }

  const valido = /\S+@\S+\.\S+/.test(email) && assunto.trim().length >= 3 && mensagem.trim().length >= 10;

  return (
    <Modal aberto={aberto} titulo="Falar com o suporte" onFechar={fechar}>
      {estado.tipo === 'enviado' ? (
        <div className="flex flex-col gap-5">
          <Aviso tom="info" titulo="Mensagem enviada!">
            Vamos responder no e-mail {email.trim()}.{estado.protocolo && ` Protocolo: ${estado.protocolo}.`}
          </Aviso>
          <Botao onClick={fechar}>Fechar</Botao>
        </div>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <p className="-mt-3 text-sm text-texto-suave">Escreva aqui; a gente responde no seu e-mail.</p>
          <Campo
            rotulo="Seu e-mail para resposta"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
          />
          <Campo rotulo="Assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} maxLength={120} required />
          <AreaTexto
            rotulo="Mensagem"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            maxLength={MENSAGEM_MAX}
            required
            ajuda={`${mensagem.length}/${MENSAGEM_MAX} caracteres. Não inclua senhas.`}
          />
          {/* Campo-armadilha para robôs: fora da tela e fora da navegação por teclado */}
          <input
            type="text"
            name="site"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={armadilha}
            onChange={(e) => setArmadilha(e.target.value)}
            className="absolute -left-[9999px] size-px opacity-0"
          />
          {estado.tipo === 'erro' &&
            (estado.codigo === 'limite_ip' || estado.codigo === 'limite_diario' ? (
              <Aviso titulo="Muitas mensagens em pouco tempo.">Tente de novo mais tarde.</Aviso>
            ) : (
              <Aviso titulo="Não foi possível enviar agora.">
                Sua mensagem ficou registrada. Se for urgente, escreva para{' '}
                <span className="font-bold select-all">{EMAIL_SUPORTE}</span>.
              </Aviso>
            ))}
          <div className="flex gap-3">
            <Botao variante="secundario" className="flex-1" onClick={fechar}>
              Cancelar
            </Botao>
            <Botao type="submit" className="flex-1" disabled={!valido || enviando}>
              {enviando ? 'Enviando...' : 'Enviar'}
            </Botao>
          </div>
        </form>
      )}
    </Modal>
  );
}
