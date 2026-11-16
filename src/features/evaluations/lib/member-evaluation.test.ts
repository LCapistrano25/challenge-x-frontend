import {
  countFilledCriteria,
  describeProgress,
  describeSubmission,
  getEvaluationStatus,
  isDraftComplete,
  progressPercent,
  toMemberNoteCreate,
} from './member-evaluation';
import type { MemberEvaluationDraft } from '../types';

const complete: MemberEvaluationDraft = {
  scores: { COMMITMENT: 4, COLLABORATION: 5, COMMUNICATION: 4, CONTRIBUTION: 4 },
  comment: '  Participou das discussões.  ',
};

describe('member-evaluation', () => {
  it('só considera completo com os 4 critérios preenchidos', () => {
    expect(isDraftComplete({ scores: {}, comment: 'ok' })).toBe(false);
    expect(isDraftComplete({ scores: { COMMITMENT: 3, COLLABORATION: 2 }, comment: '' })).toBe(
      false,
    );
    expect(countFilledCriteria(complete)).toBe(4);
    expect(isDraftComplete(complete)).toBe(true);
  });

  it('deriva a situação: enviada, em preenchimento ou não iniciada', () => {
    expect(getEvaluationStatus(true, undefined)).toBe('SENT');
    expect(getEvaluationStatus(false, undefined)).toBe('NOT_STARTED');
    expect(getEvaluationStatus(false, { scores: {}, comment: '   ' })).toBe('NOT_STARTED');
    expect(getEvaluationStatus(false, { scores: { COMMITMENT: 1 }, comment: '' })).toBe(
      'IN_PROGRESS',
    );
    expect(getEvaluationStatus(false, { scores: {}, comment: 'Nota' })).toBe('IN_PROGRESS');
  });

  it('descreve o progresso e a barra', () => {
    expect(describeProgress(1, 3)).toBe('1 de 3 avaliações enviadas');
    expect(describeProgress(0, 1)).toBe('0 de 1 avaliação enviada');
    expect(progressPercent(1, 4)).toBe(25);
    expect(progressPercent(0, 0)).toBe(0);
  });

  it('descreve o envio como no Figma', () => {
    expect(describeSubmission(complete, 'João Silva')).toBe(
      '4 de 4 critérios preenchidos · Avaliação de João Silva ainda não enviada.',
    );
  });

  it('monta o corpo de member-notes com as notas e o comentário', () => {
    expect(toMemberNoteCreate(102, complete)).toEqual({
      member_id: 102,
      content: [
        'Comprometimento: 4/5 (Boa)',
        'Colaboração: 5/5 (Excelente)',
        'Comunicação: 4/5 (Boa)',
        'Contribuição para o projeto: 4/5 (Boa)',
        '',
        'Comentário: Participou das discussões.',
      ].join('\n'),
    });
    expect(toMemberNoteCreate(1, { ...complete, comment: '' }).content).not.toContain('Comentário');
  });
});
