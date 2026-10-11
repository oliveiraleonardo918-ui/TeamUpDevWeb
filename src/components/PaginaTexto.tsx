import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Layout } from './Layout';

/** Página de texto longo (termos, privacidade), pública e sem menu. */
export function PaginaTexto({ titulo, atualizadoEm, children }: { titulo: string; atualizadoEm: string; children: ReactNode }) {
  return (
    <Layout acoes={<Link to="/" className="text-xs text-destaque hover:underline">Voltar ao início</Link>}>
      <article className="flex w-full max-w-180 flex-col gap-4 text-md leading-relaxed [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-texto-suave [&_strong]:text-texto [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:text-texto-suave">
        <h1 className="text-titulo font-bold lg:text-titulo-grande">{titulo}</h1>
        <p className="text-xs">Última atualização: {atualizadoEm}</p>
        {children}
      </article>
    </Layout>
  );
}
