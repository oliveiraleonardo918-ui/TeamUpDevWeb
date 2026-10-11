import { Link, useLocation } from 'react-router';
import iconeBuscar from '../assets/icons/search.svg';
import iconeConvites from '../assets/icons/nav-convites.svg';
import iconeMatches from '../assets/icons/nav-matches.svg';
import iconePerfil from '../assets/icons/nav-perfil.svg';
import iconeModeracao from '../assets/icons/shield.svg';
import type { Me } from '../lib/api';
import { Icone } from './Icone';

interface Destino {
  rotulo: string;
  para: string;
  icone: string;
  /** Outros caminhos em que o item aparece como ativo. */
  tambemEm?: string[];
}

// Só para a equipe (moderador e admin)
const moderacao: Destino = { rotulo: 'Moderação', para: '/moderacao', icone: iconeModeracao, tambemEm: ['/moderacao/'] };

function destinosDe(eu: Me | null): Destino[] {
  return eu?.papel === 'admin' || eu?.papel === 'moderador' ? [...destinos, moderacao] : destinos;
}

const destinos: Destino[] = [
  { rotulo: 'Buscar', para: '/buscar', icone: iconeBuscar, tambemEm: ['/jogadores/'] },
  { rotulo: 'Convites', para: '/convites', icone: iconeConvites },
  { rotulo: 'Matches', para: '/matches', icone: iconeMatches, tambemEm: ['/matches/'] },
  { rotulo: 'Perfil', para: '/jogador', icone: iconePerfil, tambemEm: ['/perfil/'] },
];

/** `forcado`: a página decide qual item fica ativo (ex.: o próprio perfil público marca "Perfil", não "Buscar"). */
function useAtivo(forcado?: string) {
  const { pathname } = useLocation();
  return (d: Destino) =>
    forcado ? d.para === forcado : pathname === d.para || (d.tambemEm ?? []).some((p) => pathname.startsWith(p));
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
export function NavegacaoTopo({ eu, ativoForcado }: { eu: Me | null; ativoForcado?: string }) {
  const ativo = useAtivo(ativoForcado);
  const lista = destinosDe(eu);
  const pendentes = eu?.convitesPendentes ?? 0;
  return (
    <nav aria-label="Principal" className="hidden lg:block">
      <ul className={`flex text-center text-base ${lista.length > 4 ? 'w-150' : 'w-120'}`}>
        {lista.map((d) => (
          <li key={d.para} className="flex-1">
            <Link
              to={d.para}
              aria-current={ativo(d) ? 'page' : undefined}
              className={
                `${foco} ${ativo(d) ? 'font-bold text-destaque underline underline-offset-4' : 'text-texto-suave hover:text-texto'}`
              }
            >
              {d.rotulo}
              <Selo destino={d} pendentes={pendentes} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Navegação principal fixa embaixo (celular). */
export function NavegacaoInferior({ eu, ativoForcado }: { eu: Me | null; ativoForcado?: string }) {
  const ativo = useAtivo(ativoForcado);
  const lista = destinosDe(eu);
  const pendentes = eu?.convitesPendentes ?? 0;
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 h-20 border-t border-borda bg-superficie px-6 py-3 lg:hidden"
    >
      <ul className="flex h-full text-center text-2xs">
        {lista.map((d) => (
          <li key={d.para} className="flex-1">
            <Link
              to={d.para}
              aria-current={ativo(d) ? 'page' : undefined}
              className={
                `flex flex-col items-center gap-1.75 ${foco} ${ativo(d) ? 'font-bold text-destaque' : 'text-texto-suave'}`
              }
            >
              <Icone src={d.icone} tamanho={20} colorir />
              <span>
                {d.rotulo}
                <Selo destino={d} pendentes={pendentes} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
