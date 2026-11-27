import { describe, expect, it } from 'vitest';
import type { AdminEdition, Criterion, EditionEvaluator, Regulation, Stage } from '../types';
import { endOfDayIso, startOfDayIso } from './dates';
import {
  filterRegulations,
  formatFileSize,
  nextVersion,
  publicationChecklist,
  validatePdfFile,
  validateRegulationForm,
} from './regulations';

const pdf = (name = 'edital.pdf', body = '%PDF-1.4 conteúdo', type = 'application/pdf') =>
  new File([body], name, { type });

describe('validatePdfFile', () => {
  it('aceita PDF com a assinatura %PDF-', async () => {
    expect(await validatePdfFile(pdf())).toBeNull();
  });

  it('rejeita .docx com a mensagem de formato', async () => {
    const docx = new File(['PK...'], 'edital.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(await validatePdfFile(docx)).toMatch(/^Formato não aceito/);
  });

  it('rejeita arquivo renomeado para .pdf sem a assinatura', async () => {
    expect(await validatePdfFile(pdf('edital.pdf', 'PK\u0003\u0004'))).toMatch(
      /não é um PDF válido/,
    );
  });

  it('rejeita arquivo acima de 10 MB', async () => {
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.pdf', {
      type: 'application/pdf',
    });
    expect(await validatePdfFile(big)).toMatch(/limite é 10 MB/);
  });

  it('rejeita arquivo vazio', async () => {
    expect(await validatePdfFile(pdf('vazio.pdf', ''))).toMatch(/vazio/);
  });
});

it('formatFileSize', () => {
  expect(formatFileSize(1.2 * 1024 * 1024)).toBe('1,2 MB');
  expect(formatFileSize(350 * 1024)).toBe('350 KB');
});

const editionRef = (id: number, year: number) => ({
  id,
  year,
  semester: 1 as const,
  name: null,
  status: 'SETUP' as const,
});

function regulation(
  id: number,
  editionId: number,
  version: number,
  status: Regulation['status'],
  title = 'Edital de participação',
): Regulation {
  return {
    id,
    edition: editionRef(editionId, editionId === 7 ? 2027 : 2026),
    title,
    description: 'Objetivo',
    version,
    status,
    file: { name: `v${version}.pdf`, size_bytes: 1_200_000, url: `/f/${id}` },
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    published_at: null,
    published_by: null,
  };
}

describe('listagem e formulário', () => {
  const items = [
    regulation(1, 3, 1, 'SUPERSEDED'),
    regulation(2, 3, 2, 'PUBLISHED'),
    regulation(3, 7, 1, 'DRAFT', 'Regulamento de avaliação'),
  ];

  it('filtra por título sem acento, edição e situação', () => {
    expect(
      filterRegulations(items, { search: 'avaliacao', editionId: '', status: '' }),
    ).toHaveLength(1);
    expect(filterRegulations(items, { search: '', editionId: '3', status: '' })).toHaveLength(2);
    expect(
      filterRegulations(items, { search: '', editionId: '', status: 'PUBLISHED' })[0]!.id,
    ).toBe(2);
  });

  it('a nova versão parte da maior versão da edição', () => {
    expect(nextVersion(items, 3)).toBe(3);
    expect(nextVersion(items, 9)).toBe(1);
  });

  it('exige título, edição, descrição e PDF', () => {
    expect(
      Object.keys(
        validateRegulationForm({ title: ' ', editionId: '', description: '' }, { hasFile: false }),
      ),
    ).toEqual(['title', 'editionId', 'description', 'file']);
    expect(
      validateRegulationForm({ title: 'T', editionId: '7', description: 'D' }, { hasFile: true }),
    ).toEqual({});
  });
});

describe('publicationChecklist', () => {
  const edition: AdminEdition = {
    id: 7,
    year: 2027,
    semester: 1,
    name: null,
    status: 'SETUP',
    regulation_url: null,
    min_members: 3,
    max_members: 5,
    published_at: null,
    closed_at: null,
    created_at: '',
    updated_at: '',
  };
  const stage = (
    id: number,
    order: number,
    [start, end, evaluation]: [string, string, string],
    max: string,
  ): Stage => ({
    id,
    edition_id: 7,
    order,
    name: `Etapa ${order}`,
    kind: 'SUBMISSION',
    starts_at: startOfDayIso(start),
    ends_at: endOfDayIso(end),
    evaluation_ends_at: endOfDayIso(evaluation),
    scored: true,
    max_score: max,
    min_evaluations: 1,
    submission_fields: [],
    created_at: '',
    updated_at: '',
  });
  const rubric =
    'Rubrica\nInsuficiente (0,1): a\nEm desenvolvimento (0,2): b\nAdequado (0,3): c\nExcelente (0,4): d';
  const criterion: Criterion = {
    id: 1,
    edition_id: 7,
    name: 'Clareza',
    rubric,
    tiebreak_order: null,
    created_at: '',
    updated_at: '',
  };
  const stages = [
    stage(1, 1, ['2027-03-01', '2027-03-25', '2027-04-01'], '4.00'),
    stage(2, 2, ['2027-04-02', '2027-06-20', '2027-06-25'], '6.00'),
  ];
  const stageCriteria = new Map([
    [1, [{ id: 1, criterion: { id: 1, name: 'Clareza' }, max_score: '4.00' }]],
    [2, [{ id: 2, criterion: { id: 1, name: 'Clareza' }, max_score: '6.00' }]],
  ]);
  const evaluator = (status: 'PENDING' | 'ACCEPTED'): EditionEvaluator => ({
    id: 1,
    edition_id: 7,
    evaluator: { user_id: 1, name: 'Ana', email: 'a@x.org', institution: null },
    course: null,
    invitation: { status, sent_at: '', responded_at: null, sent_by: null },
    created_at: '',
    updated_at: '',
  });

  it('marca tudo concluído quando a configuração está completa', () => {
    const items = publicationChecklist({
      edition,
      regulation: regulation(3, 7, 1, 'DRAFT'),
      stages,
      criteria: [criterion],
      stageCriteria,
      evaluators: [evaluator('ACCEPTED')],
    });
    expect(items.every((item) => item.done)).toBe(true);
    expect(items.find((i) => i.key === 'stages')!.detail).toBe('4,0 + 6,0 = 10,0');
    expect(items.find((i) => i.key === 'calendar')!.label).toBe(
      'Calendário consistente: 01/03 a 25/06/2027',
    );
  });

  it('aponta convites pendentes, total incompleto e rubrica a revisar', () => {
    const items = publicationChecklist({
      edition,
      regulation: regulation(3, 7, 1, 'DRAFT'),
      stages: [stages[0]!],
      criteria: [{ ...criterion, rubric: null }],
      stageCriteria,
      evaluators: [evaluator('PENDING')],
    });
    const byKey = Object.fromEntries(items.map((item) => [item.key, item]));
    expect(byKey.stages!.done).toBe(false);
    expect(byKey.criteria!.detail).toMatch(/Rubrica a revisar: Clareza/);
    expect(byKey.evaluators!.detail).toBe('1 convite aguarda confirmação.');
  });

  it('edição já publicada: configuração congelada não bloqueia a nova versão', () => {
    const items = publicationChecklist({
      edition: { ...edition, status: 'PUBLISHED' },
      regulation: regulation(4, 3, 3, 'DRAFT'),
      stages: [stages[0]!],
      criteria: [{ ...criterion, rubric: null }],
      stageCriteria,
      evaluators: [],
    });
    expect(items.every((item) => item.done)).toBe(true);
    expect(items.find((i) => i.key === 'criteria')!.detail).toMatch(/congelada/);
  });
});
