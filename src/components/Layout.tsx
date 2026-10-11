import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { buscarMe, type Me } from '../lib/api';
import { EMAIL_SUPORTE } from '../lib/config';
import { NavegacaoInferior, NavegacaoTopo } from './Navegacao';

/**
 * Barra superior + área principal, comum a todas as telas.
 * `navegacao`: telas logadas (menu no topo no desktop, barra embaixo no celular).
 * Todas as telas têm um rodapé com Suporte, Termos e Política de privacidade.
 */
const linkRodape =
  'rounded-caixa hover:text-texto hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque';

export function Layout({
  acoes,
  navegacao = false,
  children,
}: {
  acoes?: ReactNode;
  navegacao?: boolean;
  children: ReactNode;
}) {
  const [eu, setEu] = useState<Me | null>(null);

  // Papel (item Moderação) e selo de convites do menu; falhar aqui não deve atrapalhar a página
  useEffect(() => {
    if (!navegacao) return;
    let ativo = true;
    buscarMe()
      .then((r) => ativo && setEu(r))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [navegacao]);

  return (
    <div className={`flex min-h-dvh flex-col ${navegacao ? 'pb-20 lg:pb-0' : ''}`}>
      <header className="flex h-16 items-center justify-between border-b border-borda px-6 lg:h-22 lg:px-16">
        <Link
          to="/"
          className="rounded-caixa text-logo font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-destaque"
        >
          TeamUp<span className="text-destaque">.</span>
        </Link>
        {navegacao ? <NavegacaoTopo eu={eu} /> : acoes}
      </header>

      <main className="flex flex-1 flex-col items-center gap-7 px-6 pt-7 pb-8 lg:px-32 lg:py-12">
        {children}
      </main>

      <footer className="flex flex-col items-center gap-2 px-6 pb-6 text-center text-xs text-texto-suave">
        {!navegacao && <p>TeamUp · Jogue junto. Jogue com respeito.</p>}
        <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <a href={`mailto:${EMAIL_SUPORTE}`} className={linkRodape} title={EMAIL_SUPORTE}>
            Suporte
          </a>
          <Link to="/termos" className={linkRodape}>
            Termos de uso
          </Link>
          <Link to="/privacidade" className={linkRodape}>
            Política de privacidade
          </Link>
        </nav>
      </footer>

      {navegacao && <NavegacaoInferior eu={eu} />}
    </div>
  );
}
