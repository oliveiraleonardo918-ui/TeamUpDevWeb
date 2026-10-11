import iconeSemConexao from '../assets/icons/wifi-off.svg';
import { Botao } from './Botao';
import { Cartao } from './Cartao';
import { Icone } from './Icone';

/** Estado "Erro de conexão" do protótipo: falha de rede ou do servidor ao carregar uma tela. */
export function ErroConexao({ oQue, onTentar }: { oQue: string; onTentar: () => void }) {
  return (
    <div role="alert" className="flex w-full max-w-104 flex-col items-center gap-4 self-center">
      <Cartao className="flex w-full flex-col items-center gap-4 px-6 py-10 text-center">
        <span className="flex size-13 items-center justify-center rounded-2xl bg-destaque-fundo">
          <Icone src={iconeSemConexao} tamanho={26} />
        </span>
        <h2 className="text-xl font-bold">Não foi possível conectar</h2>
        <p className="text-sm text-texto-suave">
          Não conseguimos carregar {oQue}. Verifique sua conexão e tente novamente.
        </p>
        <Botao cheio={false} compacto onClick={onTentar}>
          Tentar de novo
        </Botao>
        <p className="mt-6 text-xs text-texto-suave">Seus dados estão seguros. Nenhum convite foi perdido.</p>
      </Cartao>
      <p className="text-xs text-texto-suave">A gente já volta a aproximar você do seu próximo duo.</p>
    </div>
  );
}
