import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

// Borda de 1px; no foco fica com 2px verde-água (borda + contorno interno), como no protótipo
const caixa =
  'w-full rounded-lg border border-borda bg-fundo p-3.5 text-md text-texto placeholder:text-texto-suave focus:border-destaque focus:outline-1 focus:-outline-offset-2 focus:outline-destaque aria-invalid:border-perigo';

interface Base {
  rotulo: string;
  ajuda?: string;
  erro?: string;
}

/** Rótulo + controle + erro/ajuda, com os ids de acessibilidade ligados. */
function Moldura({
  rotulo,
  ajuda,
  erro,
  controle,
}: Base & { controle: (a11y: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }) {
  const id = useId();
  const descricao = [erro && `${id}-erro`, ajuda && `${id}-ajuda`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold">
        {rotulo}
      </label>
      {controle({ id, 'aria-invalid': Boolean(erro), 'aria-describedby': descricao })}
      {erro && (
        <p id={`${id}-erro`} className="text-xs text-perigo">
          {erro}
        </p>
      )}
      {ajuda && (
        <p id={`${id}-ajuda`} className="text-xs text-texto-suave">
          {ajuda}
        </p>
      )}
    </div>
  );
}

/** Campo de texto (componente "Campo" do protótipo). */
export function Campo({ rotulo, ajuda, erro, ...props }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Moldura
      rotulo={rotulo}
      ajuda={ajuda}
      erro={erro}
      controle={(a11y) => <input className={caixa} {...a11y} {...props} />}
    />
  );
}

export function AreaTexto({ rotulo, ajuda, erro, ...props }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Moldura
      rotulo={rotulo}
      ajuda={ajuda}
      erro={erro}
      controle={(a11y) => <textarea className={`${caixa} min-h-30 resize-y`} {...a11y} {...props} />}
    />
  );
}

/** Seleção nativa com o visual de "Campo" e a setinha ▾ do protótipo. */
export function CampoSelecao({
  rotulo,
  ajuda,
  erro,
  children,
  ...props
}: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Moldura
      rotulo={rotulo}
      ajuda={ajuda}
      erro={erro}
      controle={(a11y) => (
        <div className="relative">
          <select className={`${caixa} cursor-pointer appearance-none pr-9`} {...a11y} {...props}>
            {children}
          </select>
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs">
            ▾
          </span>
        </div>
      )}
    />
  );
}
