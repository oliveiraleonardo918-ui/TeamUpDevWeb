import type { ReactNode } from 'react';
import { Icone } from './Icone';

const tons = {
  roxo: 'bg-roxo-fundo text-roxo',
  neutro: 'bg-superficie-elevada text-texto-suave',
  destaque: 'bg-destaque-fundo text-destaque',
} as const;

/** Pílula (componente "Indicador" do protótipo): destaque roxo, informação neutra (elo, função) ou filtro ativo. */
export function Indicador({
  icone,
  tom = 'roxo',
  children,
}: {
  icone?: string;
  tom?: keyof typeof tons;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.25 rounded-full px-2.5 py-1.25 text-xs font-bold ${tons[tom]}`}>
      {icone && <Icone src={icone} tamanho={14} colorir={tom !== 'roxo'} />}
      {children}
    </span>
  );
}
