import { useState } from 'react';
import { Link } from 'react-router';

const cores = {
  verde: 'bg-avatar-verde',
  roxo: 'bg-avatar-roxo',
  azul: 'bg-avatar-azul',
  marrom: 'bg-avatar-marrom',
  cinza: 'bg-avatar-cinza',
} as const;
type Cor = keyof typeof cores;

const tamanhos = {
  comentario: 'size-10 text-lg',
  card: 'size-12 text-lg',
  md: 'size-14 text-lg',
  perfil: 'size-16 text-lg',
  lg: 'size-14 text-lg lg:size-18 lg:text-3xl',
  grande: 'size-20 text-3xl',
} as const;

/** Iniciais como no protótipo: "LunaVela" → "LV", "Marina" → "MA". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+|(?=\p{Lu})/u).filter(Boolean);
  const texto = partes.length > 1 ? partes[0][0] + partes[1][0] : nome.trim().slice(0, 2);
  return texto.toUpperCase();
}

/** Cor fixa por pessoa: o mesmo jogador tem a mesma cor em todas as telas. */
function corDe(semente: string): Cor {
  const lista = Object.keys(cores) as Cor[];
  let h = 0;
  for (const ch of semente) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lista[h % lista.length];
}

/**
 * Avatar: foto do Discord quando houver (CSP libera cdn.discordapp.com); senão, ou se a imagem falhar, as iniciais.
 * A cor das iniciais vem de `cor` ou é derivada de `semente` (id do usuário).
 * `para`: vira link (normalmente para o perfil público da pessoa).
 */
export function Avatar({
  nome,
  semente,
  cor,
  foto,
  para,
  tamanho = 'md',
}: {
  nome: string;
  semente?: string;
  cor?: Cor;
  foto?: string | null;
  para?: string;
  tamanho?: keyof typeof tamanhos;
}) {
  const [falhou, setFalhou] = useState(false);
  const c = cor ?? (semente ? corDe(semente) : 'verde');
  const base = `flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${tamanhos[tamanho]}`;

  const conteudo =
    foto && !falhou ? (
      <img
        src={foto}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFalhou(true)}
        className="size-full object-cover"
      />
    ) : (
      iniciais(nome)
    );

  if (para) {
    return (
      <Link
        to={para}
        aria-label={`Ver perfil de ${nome}`}
        className={`${base} ${cores[c]} transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque`}
      >
        {conteudo}
      </Link>
    );
  }
  return (
    <span aria-hidden="true" className={`${base} ${cores[c]}`}>
      {conteudo}
    </span>
  );
}
