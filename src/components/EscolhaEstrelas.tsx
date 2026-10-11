import { useState } from 'react';

/** Seletor de nota de 1 a 5 estrelas com radios nativos (setas do teclado funcionam). */
export function EscolhaEstrelas({
  valor,
  onChange,
  legenda,
}: {
  valor: number;
  onChange: (nota: number) => void;
  legenda: string;
}) {
  const [sobre, setSobre] = useState(0);
  const mostrada = sobre || valor;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-bold">{legenda}</legend>
      <div className="flex gap-1" onMouseLeave={() => setSobre(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer" onMouseEnter={() => setSobre(n)}>
            <input
              type="radio"
              name="nota"
              value={n}
              checked={valor === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`block rounded-caixa text-4xl leading-none transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-destaque ${n <= mostrada ? 'text-estrela' : 'text-texto-suave'}`}
            >
              {n <= mostrada ? '★' : '☆'}
            </span>
            <span className="sr-only">
              {n} {n === 1 ? 'estrela' : 'estrelas'}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
