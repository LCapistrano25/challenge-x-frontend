import { FAQ_TOPICS } from '../content/faq';
import {
  describeFaqSummary,
  describeTicketError,
  describeTopicCount,
  filterFaq,
  parseQuery,
  toTicketCreate,
  validateTicket,
} from './help-center';

const questions = (query: string) =>
  filterFaq(FAQ_TOPICS, query).flatMap((topic) => topic.items.map((item) => item.question));

describe('help-center — busca', () => {
  it('sem busca mostra as 8 respostas dos 2 assuntos', () => {
    expect(describeFaqSummary(filterFaq(FAQ_TOPICS, '  '))).toBe('8 respostas · 2 assuntos');
  });

  it('filtra por palavra-chave sem diferenciar acentos e maiúsculas', () => {
    expect(questions('LIDERANCA')).toEqual([
      'O que muda entre líder e participante?',
      'Quando posso solicitar a liderança?',
    ]);
  });

  it('exige todas as palavras e aceita alternativas separadas por vírgula', () => {
    expect(questions('prazo equipe')).toEqual([
      'Como formar ou entrar em uma equipe?',
      'Onde vejo o prazo para formar a equipe?',
    ]);
    const result = filterFaq(FAQ_TOPICS, 'convites, entregas');
    expect(result.map((topic) => topic.id)).toEqual(['TEAM', 'PROJECT']);
    expect(questions('convites, entregas')).toContain('Como posso enviar uma entrega?');
  });

  it('aceita o singular de palavras no plural', () => {
    expect(questions('convites')).toContain('Como formar ou entrar em uma equipe?');
  });

  it('remove assuntos sem resultado e descreve os totais', () => {
    const result = filterFaq(FAQ_TOPICS, 'aprovada');
    expect(result).toHaveLength(1);
    expect(describeFaqSummary(result)).toBe('1 resposta · 1 assunto');
    expect(describeFaqSummary(filterFaq(FAQ_TOPICS, 'xyz'))).toBe('0 respostas · 0 assuntos');
  });

  it('descreve a quantidade por assunto', () => {
    expect(describeTopicCount(4)).toBe('4 perguntas e respostas');
    expect(describeTopicCount(1)).toBe('1 pergunta e resposta');
  });

  it('separa os grupos da busca', () => {
    expect(parseQuery(' Convites,  entrega  final ')).toEqual([['convites'], ['entrega', 'final']]);
    expect(parseQuery(' , ')).toEqual([]);
  });
});

describe('help-center — chamado', () => {
  it('valida assunto e mensagem', () => {
    expect(validateTicket({ title: ' ', description: '' })).toEqual({
      title: 'Informe o assunto.',
      description: 'Descreva sua dúvida.',
    });
    expect(validateTicket({ title: 'a'.repeat(151), description: 'ok' })).toEqual({
      title: 'Use até 150 caracteres.',
    });
    expect(validateTicket({ title: 'Dúvida', description: 'Texto' })).toEqual({});
  });

  it('envia os campos de SupportTicketCreate sem espaços nas pontas', () => {
    expect(toTicketCreate({ title: ' Prazo ', description: ' Quando termina? ' })).toEqual({
      title: 'Prazo',
      description: 'Quando termina?',
    });
  });

  it('usa mensagem genérica quando o erro não é da API', () => {
    expect(describeTicketError(new Error('rede'))).toEqual({
      message: 'Não foi possível enviar sua mensagem. Tente novamente.',
      fields: {},
    });
  });
});
