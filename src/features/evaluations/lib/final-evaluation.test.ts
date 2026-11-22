import type { FinalQuestion } from '../types';
import {
  computeTotal,
  describeConfiguration,
  draftFrom,
  formatSum,
  parseScore,
  scaleHint,
  toWrite,
  validateDraft,
  type EvaluationDraft,
} from './final-evaluation';

const question = (id: number, max = '20.00'): FinalQuestion => ({
  id,
  position: id,
  prompt: `Critério ${id}`,
  type: 'SCORE',
  max_score: max,
});

const questions = [question(1), question(2)];
const feedback = 'Parecer com mais de cinquenta caracteres para a equipe avaliada.';

const draft = (patch: Partial<EvaluationDraft> = {}): EvaluationDraft => ({
  scores: { 1: '18', 2: '16' },
  comments: {},
  texts: { 1: 'Justificativa 1', 2: 'Justificativa 2' },
  feedback,
  ...patch,
});

describe('formulário da avaliação final', () => {
  it('aceita notas com vírgula ou ponto e até duas casas', () => {
    expect(parseScore('18')).toBe(18);
    expect(parseScore('8,5')).toBe(8.5);
    expect(parseScore('8.25')).toBe(8.25);
    expect(parseScore('-1')).toBeNull();
    expect(parseScore('abc')).toBeNull();
  });

  it('soma as notas e indica total indisponível com campo inválido', () => {
    expect(formatSum(computeTotal(questions, draft()))).toBe('18 + 16 = 34');
    expect(computeTotal(questions, draft({ scores: { 1: '24', 2: '16' } })).total).toBeNull();
  });

  it('valida faixa, justificativa e o mínimo do parecer final', () => {
    expect(validateDraft(questions, draft())).toEqual({});
    expect(
      validateDraft(questions, draft({ scores: { 1: '21', 2: '' }, texts: {}, feedback: 'curto' })),
    ).toEqual({
      'score-1': 'Informe de 0 a 20.',
      'score-2': 'Informe a nota.',
      'text-1': 'Justifique a nota para continuar.',
      'text-2': 'Justifique a nota para continuar.',
      feedback: 'Escreva pelo menos 50 caracteres.',
    });
  });

  it('usa os limites do formulário publicado (escala 0–10 ou 0–20)', () => {
    expect(scaleHint(question(1, '10.00'))).toEqual([
      '0 = não atende',
      '5 = atende parcialmente',
      '10 = atende plenamente',
    ]);
    expect(describeConfiguration([question(1, '10.00'), question(2, '10.00')])).toBe(
      '2 critérios × 10 pontos = 20 pontos. Notas de 0 a 10, sem pesos adicionais. Critérios e limites definidos pelo administrador.',
    );
  });

  it('monta o corpo do PUT com nota, justificativa e comentário', () => {
    const body = toWrite(questions, draft({ comments: { 1: ' Ótimo ' } }), 'FINALIZED');
    expect(body).toEqual({
      status: 'FINALIZED',
      comment: feedback,
      answers: [
        { question_id: 1, value: '18', answer_text: 'Justificativa 1', comment: 'Ótimo' },
        { question_id: 2, value: '16', answer_text: 'Justificativa 2', comment: null },
      ],
    });
  });

  it('recupera o rascunho salvo', () => {
    const restored = draftFrom({
      id: 1,
      status: 'IN_PROGRESS',
      comment: 'Parecer',
      answers: [{ question_id: 1, type: 'SCORE', value: '8.50', answer_text: 'J', comment: 'C' }],
      finalized_at: null,
      created_at: '',
      updated_at: '',
    });
    expect(restored).toEqual({
      scores: { 1: '8,5' },
      comments: { 1: 'C' },
      texts: { 1: 'J' },
      feedback: 'Parecer',
    });
  });
});
