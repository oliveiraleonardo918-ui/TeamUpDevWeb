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
  /** Outros caminhos em que o item aparece como ativo. */
  tambemEm?: string[];
}

const destinos: Destino[] = [
  { rotulo: 'Buscar', para: '/buscar', icone: iconeBuscar, tambemEm: ['/jogadores/'] },
  { rotulo: 'Convites', para: '/convites', icone: iconeConvites },
  { rotulo: 'Matches', para: '/matches', icone: iconeMatches, tambemEm: ['/matches/'] },
  { rotulo: 'Perfil', para: '/jogador', icone: iconePerfil, tambemEm: ['/perfil/'] },
];

function useAtivo() {
  const { pathname } = useLocation();
  return (d: Destino) => pathname === d.para || (d.tambemEm ?? []).some((p) => pathname.startsWith(p));
}

const foco = 'rounded-caixa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque';

/** Selo roxo com a quantidade de convites recebidos pendentes ("Convites ❷" no protótipo). */
function Selo({ destino, pendentes }: { destino: Destino; pendentes: number }) {
  if (destino.para !== '/convites' || pendentes === 0) return null;
  return (
    <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-roxo px-1 text-2xs font-bold text-fundo">
      {pendentes > 9 ? '9+' : pendentes}
      <span className="sr-only"> {pendentes === 1 ? 'convite pendente' : 'convites pendentes'}</span>
    </span>
  );
}

/** Navegação principal no topo (desktop). */
export function NavegacaoTopo({ pendentes }: { pendentes: number }) {
  const ativo = useAtivo();
  return (
    <nav aria-label="Principal" className="hidden lg:block">
      <ul className="flex w-120 text-center text-base">
        {destinos.map((d) => (
          <li key={d.para} className="flex-1">
            <NavLink
              to={d.para}
              aria-current={ativo(d) ? 'page' : undefined}
              className={() =>
                `${foco} ${ativo(d) ? 'font-bold text-destaque underline underline-offset-4' : 'text-texto-suave hover:text-texto'}`
              }
            >
              {d.rotulo}
              <Selo destino={d} pendentes={pendentes} />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Navegação principal fixa embaixo (celular). */
export function NavegacaoInferior({ pendentes }: { pendentes: number }) {
  const ativo = useAtivo();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 h-20 border-t border-borda bg-superficie px-6 py-3 lg:hidden"
    >
      <ul className="flex h-full text-center text-2xs">
        {destinos.map((d) => (
          <li key={d.para} className="flex-1">
            <NavLink
              to={d.para}
              aria-current={ativo(d) ? 'page' : undefined}
              className={() =>
                `flex flex-col items-center gap-1.75 ${foco} ${ativo(d) ? 'font-bold text-destaque' : 'text-texto-suave'}`
              }
            >
              <Icone src={d.icone} tamanho={20} colorir />
              <span>
                {d.rotulo}
                <Selo destino={d} pendentes={pendentes} />
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
