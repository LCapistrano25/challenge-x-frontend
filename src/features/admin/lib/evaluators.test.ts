import { describe, expect, it } from 'vitest';
import type { EditionEvaluator, InvitationStatus } from '../types';
import {
  assignmentBlockReason,
  assignmentsSummary,
  canAssign,
  evaluatorCounts,
  filterEvaluators,
  hasAssignment,
  maskPhone,
  sameAssignments,
  validateInviteForm,
  emptyInviteForm,
} from './evaluators';

function link(
  id: number,
  name: string,
  institution: string,
  status?: InvitationStatus,
): EditionEvaluator {
  return {
    id,
    edition_id: 7,
    evaluator: { user_id: id, name, email: `${id}@x.org`, institution },
    course: null,
    ...(status && { invitation: { status, sent_at: '', responded_at: null, sent_by: null } }),
    assignments: [],
    created_at: '',
    updated_at: '',
  };
}

describe('convite e atribuições', () => {
  it('só libera a atribuição depois do aceite', () => {
    expect(canAssign(link(1, 'A', 'X', 'PENDING'))).toBe(false);
    expect(canAssign(link(1, 'A', 'X', 'ACCEPTED'))).toBe(true);
    expect(canAssign({ ...link(1, 'A', 'X', 'ACCEPTED'), active: false })).toBe(false);
    expect(assignmentBlockReason(link(1, 'A', 'X', 'PENDING'))).toMatch(/aceitar o convite/);
  });

  it('vínculo sem convite (API atual) conta como aceito', () => {
    expect(canAssign(link(1, 'A', 'X'))).toBe(true);
  });

  it('resume as atribuições da listagem', () => {
    const accepted = {
      ...link(1, 'A', 'X', 'ACCEPTED'),
      assignments: [
        {
          id: 1,
          team: { id: 1, name: 'Conecta' },
          project: null,
          stage: { id: 1, name: 'Apresentação' },
        },
        {
          id: 2,
          team: { id: 2, name: 'Aurora' },
          project: null,
          stage: { id: 1, name: 'Apresentação' },
        },
      ],
    };
    expect(assignmentsSummary(accepted)).toBe('Conecta · Apresentação +1');
    expect(assignmentsSummary(link(2, 'B', 'Y', 'PENDING'))).toBe('Aguardando confirmação');
  });

  it('compara e detecta atribuições repetidas', () => {
    const items = [{ team_id: 1, stage_id: 2 }];
    expect(hasAssignment(items, { team_id: 1, stage_id: 2 })).toBe(true);
    expect(sameAssignments(items, [{ team_id: 1, stage_id: 2 }])).toBe(true);
    expect(sameAssignments(items, [])).toBe(false);
  });
});

describe('listagem', () => {
  const items = [
    link(1, 'Ana Ribeiro', 'Instituto Saúde', 'ACCEPTED'),
    link(2, 'Bruno Lima', 'Coletivo Verde', 'PENDING'),
  ];
  it('busca por nome ou organização sem acento e filtra o convite', () => {
    expect(filterEvaluators(items, { search: 'saude', invitation: '' })).toHaveLength(1);
    expect(filterEvaluators(items, { search: '', invitation: 'PENDING' })[0]!.id).toBe(2);
  });
  it('conta vinculados, aceitos e pendentes', () => {
    expect(evaluatorCounts(items)).toEqual({ linked: 2, accepted: 1, pending: 1 });
  });
});

describe('formulário de convite', () => {
  it('mascara o telefone', () => {
    expect(maskPhone('63999990000')).toBe('(63) 99999-0000');
    expect(maskPhone('6332150000')).toBe('(63) 3215-0000');
  });
  it('exige os campos obrigatórios e e-mail válido', () => {
    const errors = validateInviteForm({ ...emptyInviteForm(), email: 'invalido', phone: '123' });
    expect(Object.keys(errors).sort()).toEqual(
      ['editionId', 'email', 'institution', 'name', 'phone', 'specialty'].sort(),
    );
  });
  it('impede e-mail já vinculado à edição', () => {
    const errors = validateInviteForm(
      {
        ...emptyInviteForm('7'),
        name: 'A',
        email: 'Ana@X.org',
        institution: 'X',
        specialty: 'Educação',
      },
      ['ana@x.org'],
    );
    expect(errors).toEqual({ email: 'Este avaliador já está vinculado à edição.' });
  });
});
