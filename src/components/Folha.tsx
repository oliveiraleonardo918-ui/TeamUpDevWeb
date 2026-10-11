import { useEffect, useRef, type ReactNode } from 'react';
import iconeFechar from '../assets/icons/x.svg';
import { Icone } from './Icone';

/** Painel que sobe de baixo no celular (filtros da busca). Usa <dialog> nativo: foco preso, Esc fecha. */
export function Folha({
  aberta,
  titulo,
  onFechar,
  children,
}: {
  aberta: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberta && !d.open) d.showModal();
    if (!aberta && d.open) d.close();
  }, [aberta]);

  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      onClose={onFechar}
      onClick={(e) => e.target === e.currentTarget && onFechar()}
      className="mx-0 mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-xl border border-borda bg-superficie p-6 text-texto backdrop:bg-fundo/70 lg:hidden"
    >
      <span aria-hidden="true" className="mx-auto mb-5 block h-1 w-10 rounded-full bg-texto-suave" />
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-nome font-bold">{titulo}</h2>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="rounded-caixa p-1 focus-visible:outline-2 focus-visible:outline-destaque"
        >
          <Icone src={iconeFechar} tamanho={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
