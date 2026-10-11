import type { ReactNode } from 'react';

const tons = {
  perigo: { caixa: 'bg-perigo-fundo', titulo: 'text-perigo', papel: 'alert' },
  info: { caixa: 'bg-destaque-fundo', titulo: 'text-destaque', papel: 'note' },
  roxo: { caixa: 'bg-roxo-fundo', titulo: 'text-roxo', papel: 'note' },
} as const;

/** Caixa de aviso (componente "Aviso" do protótipo): vermelha para erro, verde-água ou roxa para informação. */
export function Aviso({
  titulo,
  tom = 'perigo',
  children,
}: {
  titulo: string;
  tom?: keyof typeof tons;
  children?: ReactNode;
}) {
  const t = tons[tom];
  return (
    <div role={t.papel} className={`w-full rounded-lg p-4 ${t.caixa}`}>
      <p className={`font-bold ${t.titulo}`}>{titulo}</p>
      {children && <p className="text-sm text-texto">{children}</p>}
    </div>
  );
}
