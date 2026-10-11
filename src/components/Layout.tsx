import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { contarConvitesPendentes } from '../lib/convites';
import { NavegacaoInferior, NavegacaoTopo } from './Navegacao';

/**
 * Barra superior + área principal, comum a todas as telas.
 * `navegacao`: telas logadas (menu no topo no desktop, barra embaixo no celular, sem rodapé).
 */
export function Layout({
  acoes,
  navegacao = false,
  children,
}: {
  acoes?: ReactNode;
  navegacao?: boolean;
  children: ReactNode;
}) {
  const [pendentes, setPendentes] = useState(0);

  // Selo de convites no menu; falhar aqui não deve atrapalhar a página
  useEffect(() => {
    if (!navegacao) return;
    let ativo = true;
    contarConvitesPendentes()
      .then((r) => ativo && setPendentes(r.pendentes))
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
        {navegacao ? <NavegacaoTopo pendentes={pendentes} /> : acoes}
      </header>

      <main className="flex flex-1 flex-col items-center gap-7 px-6 pt-7 pb-8 lg:px-32 lg:py-12">
        {children}
        {!navegacao && (
          <p className="text-center text-xs text-texto-suave">TeamUp · Jogue junto. Jogue com respeito.</p>
        )}
      </main>

      {navegacao && <NavegacaoInferior pendentes={pendentes} />}
    </div>
  );
}
