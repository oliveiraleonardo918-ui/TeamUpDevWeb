/** Barra de progresso (0 a 100). `fina`: a do stepper das etapas. */
export function BarraProgresso({ valor, rotulo, fina = false }: { valor: number; rotulo: string; fina?: boolean }) {
  const altura = fina ? 'h-1' : 'h-1.5';
  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valor}
      className={`w-full overflow-hidden rounded-full bg-borda ${altura}`}
    >
      <div className={`rounded-full bg-destaque ${altura}`} style={{ width: `${valor}%` }} />
    </div>
  );
}
