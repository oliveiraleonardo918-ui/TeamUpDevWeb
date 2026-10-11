import { NavLink, useLocation } from 'react-router';
import iconeBuscar from '../assets/icons/search.svg';
import iconeConvites from '../assets/icons/nav-convites.svg';
import iconeMatches from '../assets/icons/nav-matches.svg';
import iconePerfil from '../assets/icons/nav-perfil.svg';
import { Icone } from './Icone';

interface Destino {
  rotulo: string;
  para: string;
  icone: string;
  /** Página ainda não implementada: aparece, mas não navega. */
  disponivel: boolean;
  /** Outros caminhos em que o item aparece como ativo. */
  tambemEm?: string[];
}

const destinos: Destino[] = [
  { rotulo: 'Buscar', para: '/buscar', icone: iconeBuscar, disponivel: true, tambemEm: ['/jogadores/'] },
  { rotulo: 'Convites', para: '/convites', icone: iconeConvites, disponivel: false },
  { rotulo: 'Matches', para: '/matches', icone: iconeMatches, disponivel: false },
  { rotulo: 'Perfil', para: '/jogador', icone: iconePerfil, disponivel: true, tambemEm: ['/perfil/'] },
];

function useAtivo() {
  const { pathname } = useLocation();
  return (d: Destino) => pathname === d.para || (d.tambemEm ?? []).some((p) => pathname.startsWith(p));
}

const foco = 'rounded-caixa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque';

/** Navegação principal: no topo no desktop, barra fixa embaixo no celular. */
export function NavegacaoTopo() {
  const ativo = useAtivo();
  return (
    <nav aria-label="Principal" className="hidden lg:block">
      <ul className="flex w-120 text-center text-base">
        {destinos.map((d) => (
          <li key={d.para} className="flex-1">
            {d.disponivel ? (
              <NavLink
                to={d.para}
                className={() =>
                  `${foco} ${ativo(d) ? 'font-bold text-destaque underline underline-offset-4' : 'text-texto-suave hover:text-texto'}`
                }
              >
                {d.rotulo}
              </NavLink>
            ) : (
              <span aria-disabled="true" title="Em breve" className="cursor-not-allowed text-texto-suave">
                {d.rotulo}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function NavegacaoInferior() {
  const ativo = useAtivo();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 h-20 border-t border-borda bg-superficie px-6 py-3 lg:hidden"
    >
      <ul className="flex h-full text-center text-2xs">
        {destinos.map((d) => {
          const conteudo = (
            <>
              <Icone src={d.icone} tamanho={20} colorir />
              {d.rotulo}
            </>
          );
          const base = `flex flex-col items-center gap-1.75 ${foco}`;
          return (
            <li key={d.para} className="flex-1">
              {d.disponivel ? (
                <NavLink
                  to={d.para}
                  className={() => `${base} ${ativo(d) ? 'font-bold text-destaque' : 'text-texto-suave'}`}
                >
                  {conteudo}
                </NavLink>
              ) : (
                <span aria-disabled="true" title="Em breve" className={`${base} cursor-not-allowed text-texto-suave`}>
                  {conteudo}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
