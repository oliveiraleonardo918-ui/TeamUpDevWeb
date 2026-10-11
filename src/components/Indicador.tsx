import type { ReactNode } from 'react';
import { Icone } from './Icone';

/** Pílula roxa de destaque (componente "Indicador" do protótipo). */
export function Indicador({ icone, children }: { icone?: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.25 rounded-full bg-roxo-fundo px-2.5 py-1.25 text-xs font-bold text-roxo">
      {icone && <Icone src={icone} tamanho={14} />}
      {children}
    </span>
  );
}
