import { Link } from 'react-router';
import { PaginaTexto } from '../components/PaginaTexto';
import { EMAIL_SUPORTE } from '../lib/config';

/** Termos de uso (RNF09). */
export function Termos() {
  return (
    <PaginaTexto titulo="Termos de uso" atualizadoEm="11/10/2026">
      <p>
        O TeamUp é um projeto acadêmico (UNIFOR) para encontrar duos de Valorant com respeito. Ao entrar, você concorda
        com estes termos e com a <Link to="/privacidade" className="text-destaque underline">Política de privacidade</Link>.
      </p>

      <h2>Quem pode usar</h2>
      <ul>
        <li>Pessoas com 18 anos ou mais. Você declara isso no primeiro acesso.</li>
        <li>É preciso entrar com uma conta do Discord. O TeamUp nunca pede senha de jogo.</li>
        <li>O TeamUp não é afiliado à Riot Games nem ao Discord.</li>
      </ul>

      <h2>Convivência</h2>
      <p>O TeamUp existe para partidas sem toxicidade. Não é permitido:</p>
      <ul>
        <li>ofender, assediar, discriminar ou ameaçar outras pessoas;</li>
        <li>criar perfil falso, usar o Riot ID de outra pessoa ou se passar por alguém;</li>
        <li>usar avaliações para vingança ou combinar avaliações falsas;</li>
        <li>fazer denúncias falsas ou em massa;</li>
        <li>usar os contatos recebidos após um match para outra coisa que não seja combinar partidas.</li>
      </ul>

      <h2>Convites, matches e avaliações</h2>
      <ul>
        <li>Riot ID e Discord só aparecem para as duas pessoas depois que o convite é aceito.</li>
        <li>Recusar um convite não afeta sua reputação. Depois de uma recusa, é preciso esperar alguns dias para convidar a mesma pessoa de novo.</li>
        <li>Cada match permite uma avaliação de 1 a 5 estrelas, com comentário opcional. A nota pública aparece a partir de 3 avaliações.</li>
      </ul>

      <h2>Moderação</h2>
      <p>
        Denúncias são analisadas pela equipe de moderação. Quem descumprir estes termos pode ter a conta suspensa. Toda
        ação da equipe fica registrada. Se você acha que a suspensão foi um engano, peça uma revisão pelo e-mail{' '}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="text-destaque underline">
          {EMAIL_SUPORTE}
        </a>
        .
      </p>

      <h2>Sua conta</h2>
      <p>
        Você pode excluir sua conta a qualquer momento na Área do Jogador. O que acontece com os seus dados está descrito na
        Política de privacidade.
      </p>

      <h2>Mudanças</h2>
      <p>Podemos atualizar estes termos. A data no topo da página mostra a última mudança.</p>
    </PaginaTexto>
  );
}
