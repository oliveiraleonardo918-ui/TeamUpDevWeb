import { Icone } from './Icone';

export interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
  icone?: string;
}

const estilos = {
  // "Opção" do protótipo (elo, turnos, estilo, gênero)
  caixa: {
    lista: 'gap-2',
    item: 'rounded-lg border border-borda bg-fundo px-3.5 py-2.75 text-base text-texto-suave peer-checked:border-destaque peer-checked:bg-destaque-fundo peer-checked:font-bold peer-checked:text-destaque',
  },
  // "Indicador" do protótipo (funções)
  pilula: {
    lista: 'gap-2.5',
    item: 'flex items-center gap-1.25 rounded-full bg-superficie-elevada px-2.5 py-1.25 text-xs font-bold text-texto-suave peer-checked:bg-destaque-fundo peer-checked:text-destaque',
  },
} as const;

type Props<T extends string> = {
  legenda: string;
  nome: string;
  opcoes: readonly Opcao<T>[];
  variante?: keyof typeof estilos;
  ajuda?: string;
} & (
  | { multipla?: false; valor: T | null; onChange: (v: T) => void }
  | { multipla: true; valor: readonly T[]; onChange: (v: T[]) => void }
);

/** Grupo de escolhas com inputs nativos (radio ou checkbox) e o visual de "chip" do protótipo. */
export function Opcoes<T extends string>(props: Props<T>) {
  const { legenda, nome, opcoes, variante = 'caixa', ajuda } = props;
  const e = estilos[variante];
  const idAjuda = ajuda ? `${nome}-ajuda` : undefined;

  function marcado(v: T): boolean {
    return props.multipla ? props.valor.includes(v) : props.valor === v;
  }

  function alternar(v: T) {
    if (props.multipla) {
      props.onChange(props.valor.includes(v) ? props.valor.filter((x) => x !== v) : [...props.valor, v]);
    } else {
      props.onChange(v);
    }
  }

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={idAjuda}>
      <legend className="mb-3 text-sm font-bold">{legenda}</legend>
      <div className={`flex flex-wrap ${e.lista}`}>
        {opcoes.map((o) => (
          <label key={o.valor} className="cursor-pointer">
            <input
              type={props.multipla ? 'checkbox' : 'radio'}
              name={nome}
              value={o.valor}
              checked={marcado(o.valor)}
              onChange={() => alternar(o.valor)}
              className="peer sr-only"
            />
            <span
              className={`inline-flex rounded-lg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-destaque ${e.item}`}
            >
              {o.icone && <Icone src={o.icone} tamanho={14} colorir />}
              {o.rotulo}
            </span>
          </label>
        ))}
      </div>
      {ajuda && (
        <p id={idAjuda} className="text-xs text-texto-suave">
          {ajuda}
        </p>
      )}
    </fieldset>
  );
}
