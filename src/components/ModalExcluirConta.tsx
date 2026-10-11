import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { excluirConta } from '../lib/api';
import { Aviso } from './Aviso';
import { Botao } from './Botao';
import { Campo } from './Campo';
import { Modal } from './Modal';

const CONFIRMACAO = 'EXCLUIR';

/** RNF09 (LGPD): excluir a própria conta, com confirmação digitada. */
export function ModalExcluirConta({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(false);

  function fechar() {
    setTexto('');
    setErro(false);
    onFechar();
  }

  async function excluir(e: FormEvent) {
    e.preventDefault();
    if (texto !== CONFIRMACAO) return;
    setEnviando(true);
    setErro(false);
    try {
      await excluirConta(CONFIRMACAO);
      navigate('/?conta=excluida', { replace: true });
    } catch {
      setErro(true);
      setEnviando(false);
    }
  }

  return (
    <Modal aberto={aberto} titulo="Excluir sua conta?" onFechar={fechar}>
      <form onSubmit={excluir} className="flex flex-col gap-5">
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-texto-suave">
          <li>Seus dados do Discord, seu perfil gamer, convites pendentes e sessões serão apagados.</li>
          <li>Seus matches deixam de aparecer para as outras pessoas.</li>
          <li>As avaliações que você deu continuam, sem identificar você (“Conta excluída”).</li>
          <li>Não dá para desfazer. Você pode criar uma conta nova depois, do zero.</li>
        </ul>
        <Campo
          rotulo={`Digite ${CONFIRMACAO} para confirmar`}
          value={texto}
          onChange={(e) => setTexto(e.target.value.toUpperCase())}
          autoComplete="off"
          maxLength={CONFIRMACAO.length}
        />
        {erro && <Aviso titulo="Não foi possível excluir agora. Tente de novo." />}
        <div className="flex gap-3">
          <Botao variante="secundario" className="flex-1" onClick={fechar}>
            Cancelar
          </Botao>
          <Botao type="submit" variante="perigo" className="flex-1" disabled={texto !== CONFIRMACAO || enviando}>
            {enviando ? 'Excluindo...' : 'Excluir conta'}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
