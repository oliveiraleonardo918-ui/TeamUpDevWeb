import { urlEvidencia, type Evidencia } from '../lib/moderacao';

/** Miniaturas das evidências de uma denúncia; cada uma abre a imagem inteira em nova aba (só para a equipe). */
export function Evidencias({ lista }: { lista: Evidencia[] }) {
  if (lista.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Evidências">
      {lista.map((e, i) => (
        <li key={e.id}>
          <a
            href={urlEvidencia(e.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-borda transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
          >
            <img
              src={urlEvidencia(e.id)}
              alt={`Evidência ${i + 1} (abre em nova aba)`}
              loading="lazy"
              className="size-14 object-cover"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
