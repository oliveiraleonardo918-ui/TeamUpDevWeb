const cores = {
  verde: 'bg-avatar-verde',
  roxo: 'bg-avatar-roxo',
} as const;

const tamanhos = {
  md: 'size-14 text-lg',
  lg: 'size-14 text-lg lg:size-18 lg:text-3xl',
} as const;

/** Avatar com iniciais (sem imagem externa). */
export function Avatar({
  iniciais,
  cor = 'verde',
  tamanho = 'md',
}: {
  iniciais: string;
  cor?: keyof typeof cores;
  tamanho?: keyof typeof tamanhos;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${cores[cor]} ${tamanhos[tamanho]}`}
    >
      {iniciais}
    </span>
  );
}
