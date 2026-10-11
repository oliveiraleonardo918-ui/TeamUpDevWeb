/** Nota de 1 a 5 em estrelas (★ cheias em amarelo, ☆ vazias em cinza). */
export function Estrelas({ nota, tamanho = 'text-lg' }: { nota: number; tamanho?: string }) {
  const cheias = Math.round(nota);
  return (
    <p role="img" aria-label={`Nota ${nota.toLocaleString('pt-BR')} de 5`} className={`leading-[1.2] ${tamanho}`}>
      <span className="text-estrela">{'★'.repeat(cheias)}</span>
      <span className="text-texto-suave">{'☆'.repeat(5 - cheias)}</span>
    </p>
  );
}

export function formatarNota(nota: number): string {
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
