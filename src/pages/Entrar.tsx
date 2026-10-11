import { useState } from 'react';
import iconeCadeado from '../assets/icons/lock-keyhole.svg';
import iconeEstrela from '../assets/icons/star.svg';
import iconeFiltros from '../assets/icons/sliders-horizontal.svg';
import iconeLink from '../assets/icons/link.svg';
import iconeMensagem from '../assets/icons/message-circle.svg';
import iconeUsuarios from '../assets/icons/users.svg';
import { Avatar } from '../components/Avatar';
import { Botao } from '../components/Botao';
import { Cartao } from '../components/Cartao';
import { Icone } from '../components/Icone';
import { Indicador } from '../components/Indicador';
import { Layout } from '../components/Layout';
import { Selecao } from '../components/Selecao';
import { urlLoginDiscord } from '../lib/api';

const vantagens = [
  { icone: iconeFiltros, texto: 'Filtros por função e elo' },
  { icone: iconeEstrela, texto: 'Reputação real' },
  { icone: iconeCadeado, texto: 'Contato só após match mútuo' },
];

/** Tela "Entrar" (RF01, RN06: confirmação de 18+ obrigatória antes do login). */
export function Entrar() {
  const [maiorDeIdade, setMaiorDeIdade] = useState(false);

  return (
    <Layout acoes={<p className="text-xs text-destaque">Respeito primeiro</p>}>
      <div className="flex w-full max-w-296 flex-col gap-8 pt-6 lg:flex-row lg:items-center lg:gap-25 lg:pt-16">
        <section className="flex min-w-0 flex-col items-start gap-7 lg:flex-1">
          <Indicador icone={iconeUsuarios}>Um bom duo muda a partida</Indicador>
          <h1 className="text-4xl font-bold lg:text-5xl">Encontre seu duo sem toxicidade</h1>
          <p className="text-lg text-texto-suave lg:text-xl">
            A partida começa melhor quando a companhia respeita você.
          </p>
          <Cartao className="flex h-27.5 w-full items-center justify-center gap-4 lg:h-42.5">
            <Avatar iniciais="MA" cor="verde" tamanho="lg" />
            <div className="flex flex-col items-center gap-2">
              <Icone src={iconeLink} tamanho={24} />
              <span className="text-xs text-roxo">Respeito mútuo</span>
            </div>
            <Avatar iniciais="LV" cor="roxo" tamanho="lg" />
          </Cartao>
          <p className="hidden text-sm text-texto-suave lg:block">
            Seu Riot ID e Discord ficam privados até os dois aceitarem jogar juntos.
          </p>
        </section>

        <Cartao className="flex flex-col gap-6 lg:w-123.5 lg:shrink-0">
          <h2 className="text-2xl font-bold">Que bom ter você aqui.</h2>
          <p className="text-md text-texto-suave">
            Entre com sua conta do Discord e encontre uma parceria no seu ritmo.
          </p>
          <ul className="flex flex-col gap-4.5">
            {vantagens.map((v) => (
              <li key={v.texto} className="flex items-center gap-3">
                <Icone src={v.icone} tamanho={20} />
                {v.texto}
              </li>
            ))}
          </ul>
          <hr className="border-borda" />
          <Selecao
            checked={maiorDeIdade}
            onChange={(e) => setMaiorDeIdade(e.target.checked)}
            aria-describedby="aviso-idade"
          >
            Tenho 18 anos ou mais
          </Selecao>
          <p id="aviso-idade" className="text-xs text-texto-suave">
            Confirmação obrigatória para continuar.
          </p>
          <Botao disabled={!maiorDeIdade} onClick={() => window.location.assign(urlLoginDiscord)}>
            <Icone src={iconeMensagem} tamanho={18} />
            Entrar com Discord
          </Botao>
          <p className="text-center text-xs text-texto-suave">
            Ao entrar, você concorda com os Termos de uso e a Política de privacidade.
          </p>
        </Cartao>
      </div>
    </Layout>
  );
}
