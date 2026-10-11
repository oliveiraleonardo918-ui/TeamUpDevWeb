import type { InputHTMLAttributes, ReactNode } from 'react';
import iconeCheck from '../assets/icons/check.svg';

/** Checkbox nativo com o visual do protótipo (componente "Escolha"). */
export function Selecao({
  children,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-base">
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-caixa border border-borda bg-fundo checked:border-destaque checked:bg-destaque focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
          {...props}
        />
        <img
          src={iconeCheck}
          width={14}
          height={14}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute hidden peer-checked:block"
        />
      </span>
      {children}
    </label>
  );
}
