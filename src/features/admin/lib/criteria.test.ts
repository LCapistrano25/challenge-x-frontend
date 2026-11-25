import type { Criterion, Stage, StageCriterion } from '../types';
import {
  buildCriterionRows,
  filterCriterionRows,
  planCriterionLink,
  planStageCriteria,
  validateCriterionForm,
} from './criteria';

const stage = (id: number, order: number, name: string, maxScore: string) =>
  ({ id, order, name, scored: true, max_score: maxScore }) as Stage;
const criterion = (id: number, name: string, rubric: string | null = null) =>
  ({ id, edition_id: 7, name, rubric, tiebreak_order: null }) as Criterion;
const link = (criterionId: number, name: string, maxScore: string): StageCriterion => ({
  id: criterionId * 10,
  criterion: { id: criterionId, name },
  max_score: maxScore,
});

const entrega = stage(3, 3, 'Entrega', '3.00');
const apresentacao = stage(4, 4, 'Apresentação', '2.00');
const stages = [entrega, apresentacao];
const criteria = [
  criterion(703, 'Resultado e evidências'),
  criterion(704, 'Clareza da apresentação'),
  criterion(705, 'Domínio da proposta'),
  criterion(706, 'Respostas à banca'),
  criterion(707, 'Impacto social'),
];
const stageCriteria = new Map([
  [3, [link(703, 'Resultado e evidências', '3.00')]],
  [
    4,
    [
      link(704, 'Clareza da apresentação', '0.80'),
      link(705, 'Domínio da proposta', '0.80'),
      link(706, 'Respostas à banca', '0.40'),
    ],
  ],
]);

describe('linhas da tabela de critérios', () => {
  const rows = buildCriterionRows(criteria, stages, stageCriteria);

  it('lista os critérios pela ordem das etapas e os sem etapa no fim', () => {
    expect(rows.map((row) => [row.criterion.name, row.stage?.name ?? null, row.maxScore])).toEqual([
      ['Resultado e evidências', 'Entrega', 3],
      ['Clareza da apresentação', 'Apresentação', 0.8],
      ['Domínio da proposta', 'Apresentação', 0.8],
      ['Respostas à banca', 'Apresentação', 0.4],
      ['Impacto social', null, null],
    ]);
  });

  it('busca sem acento e filtra por etapa', () => {
    expect(filterCriterionRows(rows, 'dominio', '').map((r) => r.criterion.id)).toEqual([705]);
    expect(filterCriterionRows(rows, '', '3').map((r) => r.criterion.id)).toEqual([703]);
    expect(filterCriterionRows(rows, '', 'none').map((r) => r.criterion.id)).toEqual([707]);
  });
});

describe('validateCriterionForm', () => {
  const context = { criteria, stages, stageCriteria, criterionId: 704 };

  it('a soma dos critérios não passa do limite da etapa', () => {
    expect(
      validateCriterionForm(
        { name: 'Clareza da apresentação', stageId: '4', maxScore: '1,0', description: '' },
        context,
      ).maxScore,
    ).toBe('A soma dos critérios de Apresentação passaria do limite da etapa (2,2 de 2,0).');
    expect(
      validateCriterionForm(
        { name: 'Clareza da apresentação', stageId: '4', maxScore: '0,8', description: '' },
        context,
      ),
    ).toEqual({});
  });

  it('formulário vazio aponta todos os campos obrigatórios', () => {
    expect(
      validateCriterionForm({ name: '', stageId: '', maxScore: '', description: '' }, context),
    ).toEqual({
      name: 'Informe o nome do critério.',
      stageId: 'Selecione a etapa.',
      maxScore: 'Informe a pontuação máxima.',
    });
    expect(
      validateCriterionForm(
        { name: 'Novo', stageId: '4', maxScore: '1,555', description: '' },
        context,
      ).maxScore,
    ).toBe('Use um número com até 2 casas decimais, ex.: 1,5.');
  });

  it('nome único na edição, etapa obrigatória', () => {
    const errors = validateCriterionForm(
      { name: 'respostas à banca', stageId: '', maxScore: '0,4', description: '' },
      context,
    );
    expect(errors.name).toBe('Já existe critério com este nome na edição.');
    expect(errors.stageId).toBe('Selecione a etapa.');
  });
});

describe('planCriterionLink', () => {
  it('troca de etapa: libera a antiga antes de gravar a nova', () => {
    const changes = planCriterionLink(
      706,
      { stageId: 4, maxScore: 0.4 },
      { stageId: 3, maxScore: 0.5 },
      stageCriteria,
    );
    expect(changes).toEqual([
      {
        stageId: 4,
        items: [
          { criterion_id: 704, max_score: '0.80' },
          { criterion_id: 705, max_score: '0.80' },
        ],
      },
      {
        stageId: 3,
        items: [
          { criterion_id: 703, max_score: '3.00' },
          { criterion_id: 706, max_score: '0.50' },
        ],
      },
    ]);
  });

  it('na mesma etapa, o critério mantém a posição', () => {
    expect(
      planCriterionLink(
        704,
        { stageId: 4, maxScore: 0.8 },
        { stageId: 4, maxScore: 0.7 },
        stageCriteria,
      ),
    ).toEqual([
      {
        stageId: 4,
        items: [
          { criterion_id: 704, max_score: '0.70' },
          { criterion_id: 705, max_score: '0.80' },
          { criterion_id: 706, max_score: '0.40' },
        ],
      },
    ]);
  });

  it('sem mudança de etapa nem pontos, não grava nada', () => {
    expect(
      planCriterionLink(
        706,
        { stageId: 4, maxScore: 0.4 },
        { stageId: 4, maxScore: 0.4 },
        stageCriteria,
      ),
    ).toEqual([]);
  });
});

describe('planStageCriteria', () => {
  const current = stageCriteria.get(4)!;

  it('critério único recebe a pontuação da etapa', () => {
    expect(planStageCriteria([703], [], 3)).toEqual({
      items: [{ criterion_id: 703, max_score: '3.00' }],
    });
  });

  it('mantém os pontos dos critérios já vinculados e divide o que sobra entre os novos', () => {
    expect(planStageCriteria([704, 705, 707], current, 2)).toEqual({
      items: [
        { criterion_id: 704, max_score: '0.80' },
        { criterion_id: 705, max_score: '0.80' },
        { criterion_id: 707, max_score: '0.40' },
      ],
    });
  });

  it('avisa quando não há pontos livres para o novo critério', () => {
    expect(planStageCriteria([704, 705, 706, 707], current, 2)).toHaveProperty('error');
  });
});
