import { PaginaTexto } from '../components/PaginaTexto';
import { EMAIL_SUPORTE } from '../lib/config';

/** Política de privacidade (RNF09, LGPD). Descreve exatamente o que o app coleta e guarda. */
export function Privacidade() {
  return (
    <PaginaTexto titulo="Política de privacidade" atualizadoEm="11/10/2026">
      <p>
        Esta política explica quais dados o TeamUp guarda, para quê e como você controla isso, de acordo com a Lei Geral de
        Proteção de Dados (LGPD, Lei 13.709/2018).
      </p>

      <h2>O que coletamos</h2>
      <ul>
        <li>
          <strong>Do Discord, ao entrar:</strong> seu ID, nome de usuário, nome de exibição e avatar. Pedimos só a permissão
          de identificação (“identify”); não lemos suas mensagens, servidores nem e-mail.
        </li>
        <li>
          <strong>Do seu perfil gamer:</strong> Riot ID, elo, funções, horários, disponibilidade, estilo de jogo, bio e,
          se você quiser, gênero.
        </li>
        <li>
          <strong>Do uso do app:</strong> convites, matches, avaliações que você dá e recebe, denúncias e a data em que você
          declarou ter 18 anos ou mais.
        </li>
        <li>
          <strong>Suporte:</strong> o e-mail e a mensagem que você envia pelo formulário de suporte, para podermos
          responder. A mensagem é enviada ao nosso e-mail pelo serviço Resend. Para evitar spam, guardamos uma versão
          embaralhada (hash) do seu endereço de rede, nunca o endereço em si.
        </li>
        <li>
          <strong>Sessão:</strong> um cookie de login (HttpOnly) para manter você conectado por até 30 dias. Não usamos
          cookies de publicidade nem rastreadores.
        </li>
      </ul>

      <h2>Para que usamos</h2>
      <ul>
        <li>Mostrar seu perfil na busca e calcular a compatibilidade com outros jogadores.</li>
        <li>Permitir convites, matches e a troca de contatos depois do aceite mútuo.</li>
        <li>Calcular a reputação a partir das avaliações.</li>
        <li>Manter a comunidade segura: analisar denúncias e aplicar suspensões.</li>
      </ul>
      <p>
        A base legal é a execução do serviço que você pediu ao criar a conta. O gênero só é exibido e usado no filtro com o
        seu consentimento, que você pode retirar a qualquer momento no perfil.
      </p>

      <h2>Quem vê o quê</h2>
      <ul>
        <li>
          <strong>Qualquer jogador logado:</strong> nome, foto de perfil do Discord, elo, funções, horários, estilo,
          bio, reputação e comentários recebidos. Gênero, só se você autorizou.
        </li>
        <li>
          <strong>Só quem deu match com você:</strong> Riot ID e usuário do Discord.
        </li>
        <li>
          <strong>Só a equipe de moderação:</strong> denúncias, inclusive quem denunciou e as imagens anexadas como
          evidência. O denunciado nunca sabe quem fez a denúncia.
        </li>
      </ul>
      <p>
        Os dados ficam na infraestrutura da Cloudflare (Workers e D1), que processa as informações em nosso nome. Não
        vendemos nem compartilhamos seus dados com terceiros para publicidade.
      </p>

      <h2>Seus direitos</h2>
      <ul>
        <li>
          <strong>Acesso e correção:</strong> tudo o que está no seu perfil pode ser visto e editado na Área do Jogador.
        </li>
        <li>
          <strong>Exclusão:</strong> em “Excluir minha conta”, na Área do Jogador. Apagamos seus dados do Discord, seu perfil
          gamer, convites pendentes e sessões. As avaliações que você deu continuam, mas sem identificar você (aparecem como
          “Conta excluída”), para não distorcer a reputação de outras pessoas. Registros de moderação são mantidos da mesma
          forma, sem identificar você.
        </li>
        <li>
          <strong>Dúvidas e outros pedidos:</strong>{' '}
          <a href={`mailto:${EMAIL_SUPORTE}`} className="text-destaque underline">
            {EMAIL_SUPORTE}
          </a>
          .
        </li>
      </ul>

      <h2>Mudanças</h2>
      <p>Se esta política mudar, a data no topo da página será atualizada.</p>
    </PaginaTexto>
  );
}
