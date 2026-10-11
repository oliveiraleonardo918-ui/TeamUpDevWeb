/** Ícone decorativo (SVG local exportado do Figma). Para ícone com significado, passe `rotulo`. */
export function Icone({ src, tamanho, rotulo }: { src: string; tamanho: number; rotulo?: string }) {
  return (
    <img
      src={src}
      width={tamanho}
      height={tamanho}
      alt={rotulo ?? ''}
      aria-hidden={rotulo ? undefined : true}
      className="shrink-0"
    />
  );
}
