import type { ButtonHTMLAttributes } from 'react';

const variantes = {
  // CTA verde-água; o anel de foco segue o estado "focado" do protótipo
  primario:
    'border-3 border-transparent bg-destaque text-destaque-contraste enabled:hover:bg-destaque-hover focus-visible:border-fundo focus-visible:shadow-foco',
  // Ações destrutivas (denunciar, banir)
  perigo:
    'border border-perigo bg-perigo-fundo text-perigo enabled:hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo',
  secundario:
    'border border-borda bg-superficie-elevada text-texto enabled:hover:border-texto-suave enabled:hover:bg-borda focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque',
} as const;

export function Botao({
  variante = 'primario',
  cheio = true,
  compacto = false,
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof variantes;
  /** false: largura do conteúdo em vez de ocupar a linha toda */
  cheio?: boolean;
  /** Altura menor (40px), para ações dentro de listas */
  compacto?: boolean;
}) {
  return (
    <button
      type={type}
      className={`flex ${compacto ? 'h-10' : 'h-12'} ${cheio ? 'w-full' : 'w-auto'} items-center justify-center gap-2 rounded-lg px-4 text-base font-bold whitespace-nowrap outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}
