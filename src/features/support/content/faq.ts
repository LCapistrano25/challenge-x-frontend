import type { FaqTopic } from '../types';

/**
 * Perguntas frequentes da Central de ajuda (Figma: 03 - Acadêmico › "Dúvidas — Central de
 * ajuda", 621:6989). A API não tem modelo para o canal de dúvidas (P-35), então o conteúdo é
 * estático no front até que o back-end decida modelá-lo.
 */
export const FAQ_TOPICS: readonly FaqTopic[] = [
  {
    id: 'TEAM',
    title: 'Equipe e liderança',
    items: [
      {
        question: 'Como formar ou entrar em uma equipe?',
        answer:
          'Acesse Equipe para criar uma equipe ou solicitar entrada em uma existente. Você também pode responder a um convite recebido. Consulte o prazo de formação no painel.',
      },
      {
        question: 'O que muda entre líder e participante?',
        answer:
          'O líder envia convites, aprova solicitações e avalia os membros. O participante pode consultar a equipe e sair dela, mas não pode realizar essas ações de liderança.',
      },
      {
        question: 'Quando posso solicitar a liderança?',
        answer:
          'Somente quando o líder sair da equipe sem transferir a liderança. Nessa situação, acesse Equipe e utilize a opção de solicitar liderança.',
      },
      {
        question: 'Onde vejo o prazo para formar a equipe?',
        answer:
          'Na Home, consulte o prazo restante de formação da equipe. Use a informação exibida no painel para acompanhar quanto tempo ainda está disponível.',
      },
    ],
  },
  {
    id: 'PROJECT',
    title: 'Projeto e entregas',
    items: [
      {
        question: 'Onde consulto o projeto da minha equipe?',
        answer:
          'Acesse Projeto para consultar os dados do projeto e as entregas por etapa. Use essa área para acompanhar os envios e a situação de cada entrega.',
      },
      {
        question: 'Como posso enviar uma entrega?',
        answer:
          'Em Projeto, localize a etapa e a ação de envio. A entrega pode ser feita em arquivo, texto ou link. Consulte as orientações da etapa antes de enviar.',
      },
      {
        question: 'Entrega feita significa que foi aprovada?',
        answer:
          'Não. Uma entrega enviada fica aguardando avaliação; o envio não representa aprovação automática. Acompanhe o status da etapa para saber o resultado.',
      },
      {
        question: 'Onde acompanho prazos e status?',
        answer:
          'Consulte a Home e a área Projeto. O painel mostra os status das entregas; em Projeto, confira também o prazo e as informações de cada etapa.',
      },
    ],
  },
];
