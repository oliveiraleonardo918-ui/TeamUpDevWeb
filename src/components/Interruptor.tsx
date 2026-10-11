import { useId } from 'react';

/** Interruptor liga/desliga (componente "Interruptor" do protótipo), com título e descrição. */
export function Interruptor({
  titulo,
  descricao,
  ligado,
  onChange,
}: {
  titulo: string;
  descricao?: string;
  ligado: boolean;
  onChange: (ligado: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p id={`${id}-titulo`} className="font-bold">
          {titulo}
        </p>
        {descricao && (
          <p id={`${id}-descricao`} className="text-xs text-texto-suave">
            {descricao}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-labelledby={`${id}-titulo`}
        aria-describedby={descricao ? `${id}-descricao` : undefined}
        onClick={() => onChange(!ligado)}
        className={`relative h-6 w-10.5 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque ${ligado ? 'bg-destaque' : 'bg-borda'}`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full transition-all ${ligado ? 'left-5.5 bg-fundo' : 'left-1 bg-texto-suave'}`}
        />
      </button>
    </div>
  );
}
