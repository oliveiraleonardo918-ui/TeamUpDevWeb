import type { ReactNode } from 'react';

/** Caixa de alerta vermelha (componente "Aviso" do protótipo). */
export function Aviso({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div role="alert" className="w-full rounded-lg bg-perigo-fundo p-4">
      <p className="font-bold text-perigo">{titulo}</p>
      {children && <p className="text-sm text-texto">{children}</p>}
    </div>
  );
}
