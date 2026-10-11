import { Link } from 'react-router';
import iconeEmail from '../assets/icons/mail.svg';
import iconeEscudo from '../assets/icons/shield-x.svg';
import { Aviso } from '../components/Aviso';
import { Cartao } from '../components/Cartao';
import { Icone } from '../components/Icone';
import { Layout } from '../components/Layout';
import { EMAIL_SUPORTE } from '../lib/config';

/**
 * RN07: banido não loga. Não há sessão aqui, por isso a mensagem não traz o nome
 * do jogador (no protótipo aparece "IvoFluxo, sua conta...").
 */
export function ContaSuspensa() {
  return (
    <Layout acoes={<p className="text-xs text-destaque">Respeito primeiro</p>}>
      <div className="flex w-full max-w-160 flex-col gap-6 pt-8 lg:pt-18">
        <Cartao className="flex flex-col gap-4">
          <section className="flex min-h-85 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
            <span className="flex size-20 items-center justify-center rounded-3xl bg-perigo-fundo">
              <Icone src={iconeEscudo} tamanho={36} />
            </span>
            <h1 className="text-2xl font-bold">Conta suspensa</h1>
            <p className="text-md text-texto-suave">
              Sua conta está suspensa por violar as regras de convivência do TeamUp.
            </p>
          </section>
          <Aviso titulo="Acesso temporariamente bloqueado">
            Buscar, convites e matches estão indisponíveis enquanto sua conta estiver suspensa.
          </Aviso>
          {EMAIL_SUPORTE && (
            <a
              href={`mailto:${EMAIL_SUPORTE}`}
              className="flex h-12 items-center justify-center gap-2 rounded-lg border border-borda bg-superficie-elevada px-4 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
            >
              <Icone src={iconeEmail} tamanho={18} />
              Falar com o suporte
            </a>
          )}
          {/* Visível para copiar: o mailto não funciona sem um app de e-mail configurado */}
          <p className="-mt-2 text-center text-xs text-texto-suave">
            ou escreva para <span className="text-texto select-all">{EMAIL_SUPORTE}</span>
          </p>
          <Link
            to="/"
            className="self-center rounded-caixa text-sm text-texto-suave hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
          >
            Sair da conta
          </Link>
        </Cartao>
        <p className="text-center text-sm text-texto-suave">Você pode pedir uma revisão à equipe de suporte.</p>
      </div>
    </Layout>
  );
}
