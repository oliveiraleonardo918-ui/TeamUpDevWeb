import { useNavigate } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Cartao } from '../components/Cartao';
import { Layout } from '../components/Layout';
import { sair } from '../lib/api';
import { useUsuario } from '../lib/useUsuario';

function iniciais(nome: string): string {
  return nome.trim().slice(0, 2).toUpperCase();
}

/** Área do Jogador (RF01: destino após o login). O checklist do perfil gamer entra com o RF02/RF03. */
export function AreaJogador() {
  const usuario = useUsuario();
  const navigate = useNavigate();

  async function sairDaConta() {
    await sair().catch(() => undefined);
    navigate('/', { replace: true });
  }

  return (
    <Layout
      acoes={
        <button
          type="button"
          onClick={sairDaConta}
          className="rounded-caixa text-sm text-texto-suave hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
        >
          Sair
        </button>
      }
    >
      <div className="flex w-full max-w-160 flex-col gap-6 pt-8 lg:pt-18">
        {usuario ? (
          <Cartao className="flex items-center gap-4">
            <Avatar iniciais={iniciais(usuario.nome)} />
            <div>
              <h1 className="text-2xl font-bold">Olá, {usuario.nome}!</h1>
              <p className="text-md text-texto-suave">Você entrou como @{usuario.discordUsername}.</p>
            </div>
          </Cartao>
        ) : (
          <p className="text-center text-texto-suave" role="status">
            Carregando...
          </p>
        )}
      </div>
    </Layout>
  );
}
