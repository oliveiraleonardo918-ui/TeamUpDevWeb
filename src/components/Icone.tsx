/**
 * Ícone decorativo (SVG local exportado do Figma). Para ícone com significado, passe `rotulo`.
 * `colorir`: usa o SVG como máscara e pinta com a cor do texto (para ícones que mudam de cor no estado selecionado).
 */
export function Icone({
  src,
  tamanho,
  rotulo,
  colorir = false,
}: {
  src: string;
  tamanho: number;
  rotulo?: string;
  colorir?: boolean;
}) {
  if (colorir) {
    // Aspas no url(): SVGs pequenos viram data: URI no build, com caracteres que quebram o url() sem aspas
    const mascara = `url("${src}") center / contain no-repeat`;
    return (
      <span
        aria-hidden="true"
        className="shrink-0 bg-current"
        style={{ width: tamanho, height: tamanho, mask: mascara, WebkitMask: mascara }}
      />
    );
  }
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
