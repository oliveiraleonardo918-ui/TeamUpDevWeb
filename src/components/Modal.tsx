import { useEffect, useRef, type ReactNode } from 'react';
import iconeFechar from '../assets/icons/x.svg';
import { Icone } from './Icone';

/** Janela de confirmação centralizada. Usa <dialog> nativo: foco preso, Esc fecha. */
export function Modal({
  aberto,
  titulo,
  onFechar,
  children,
}: {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      onClose={onFechar}
      onClick={(e) => e.target === e.currentTarget && onFechar()}
      className="m-auto w-[calc(100%-3rem)] max-w-100 rounded-xl border border-borda bg-superficie p-6 text-texto backdrop:bg-fundo/70"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{titulo}</h2>
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
