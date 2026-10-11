import { useState, type FormEvent } from 'react';
import { Botao } from './Botao';
import { CampoSelecao } from './Campo';
import { Interruptor } from './Interruptor';
import { GENEROS_FILTRO, type Filtros } from '../lib/jogadores';
import { ELOS, ESTILOS, TURNOS } from '../lib/perfil';

/**
 * Formulário de filtros (RF05). Edita um rascunho e só aplica em "Aplicar filtros".
 * Quem usa passa `key` com os filtros aplicados para o rascunho recomeçar quando eles mudam.
 */
export function PainelFiltros({
  aplicados,
  onAplicar,
  titulo = 'Filtros',
}: {
  aplicados: Filtros;
  onAplicar: (f: Filtros) => void;
  titulo?: string;
}) {
  const [f, setF] = useState<Filtros>(aplicados);
  const mudar = <K extends keyof Filtros>(chave: K, valor: Filtros[K]) => setF((atual) => ({ ...atual, [chave]: valor }));
  // <select> trabalha com string; "" = sem filtro
  const ou = <T extends string>(v: string) => (v === '' ? undefined : (v as T));

  function aplicar(e: FormEvent) {
    e.preventDefault();
    onAplicar(f);
  }

  function limpar() {
    setF({});
    onAplicar({});
  }

  return (
    <form onSubmit={aplicar} className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="flex-1 text-subtitulo font-bold">{titulo}</h2>
        <button
          type="button"
          onClick={limpar}
          className="rounded-caixa text-xs text-destaque hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
        >
          Limpar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao rotulo="Elo mínimo" value={f.eloMin ?? ''} onChange={(e) => mudar('eloMin', ou(e.target.value))}>
          <option value="">Todos</option>
          {ELOS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </CampoSelecao>
        <CampoSelecao rotulo="Elo máximo" value={f.eloMax ?? ''} onChange={(e) => mudar('eloMax', ou(e.target.value))}>
          <option value="">Todos</option>
          {ELOS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </CampoSelecao>
      </div>

      <Interruptor
        titulo="Só funções complementares à minha"
        ligado={Boolean(f.complementar)}
        onChange={(v) => mudar('complementar', v || undefined)}
      />
      <hr className="border-borda" />

      <CampoSelecao
        rotulo="Turno"
        value={f.turno ?? ''}
        onChange={(e) => mudar('turno', ou(e.target.value))}
        ajuda="Manhã · Tarde · Noite · Madrugada"
      >
        <option value="">Todos os turnos</option>
        {TURNOS.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </CampoSelecao>

      <CampoSelecao
        rotulo="Estilo de jogo"
        value={f.estilo ?? ''}
        onChange={(e) => mudar('estilo', ou(e.target.value))}
        ajuda="Casual · Competitivo"
      >
        <option value="">Todos os estilos</option>
        {ESTILOS.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </CampoSelecao>

      <CampoSelecao
        rotulo="Gênero"
        value={f.genero ?? ''}
        onChange={(e) => mudar('genero', ou(e.target.value))}
        ajuda="Inclui apenas quem optou por exibir."
      >
        <option value="">Todos</option>
        {GENEROS_FILTRO.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </CampoSelecao>

      <Botao type="submit">Aplicar filtros</Botao>
    </form>
  );
}
