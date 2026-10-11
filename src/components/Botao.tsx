import type { ButtonHTMLAttributes } from 'react';

const variantes = {
  // CTA verde-água; o anel de foco segue o estado "focado" do protótipo
  primario:
    'border-3 border-transparent bg-destaque text-destaque-contraste focus-visible:border-fundo focus-visible:shadow-foco',
  secundario:
    'border border-borda bg-superficie-elevada text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque',
} as const;

export function Botao({
  variante = 'primario',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof variantes }) {
  return (
    <button
      type={type}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-base font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}
