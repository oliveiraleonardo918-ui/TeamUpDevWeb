import type { ButtonHTMLAttributes } from 'react';

/** Botão principal (CTA verde-água). O anel de foco segue o estado "focado" do protótipo. */
export function Botao({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg border-3 border-transparent bg-destaque px-4 text-base font-bold text-destaque-contraste outline-none focus-visible:border-fundo focus-visible:shadow-foco disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
