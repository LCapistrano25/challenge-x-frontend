import type {
  AdminEdition,
  Criterion,
  Stage,
  StageCriteriaItem,
  StageCriterion,
} from '@/features/admin';

/**
 * Configuração da avaliação (task #23), com os dados do Figma (04 - Administrador › Etapas e
 * Avaliações). Formatos de docs/api/openapi.yaml: Edition, Stage, Criterion e StageCriterion.
 */

/** Edição em configuração usada nas telas (Figma: "Desafio X • 2027"). */
export const SETUP_EDITION_ID = 7;
/** Edição com edital publicado: configuração congelada (409 edition_published). */
export const PUBLISHED_EDITION_ID = 3;

const STAMP = '2026-10-22T16:00:00Z';

function edition(
  id: number,
  year: number,
  semester: 1 | 2,
  status: AdminEdition['status'],
): AdminEdition {
  return {
    id,
    year,
    semester,
    name: `Desafio X ${year}/${semester}`,
    status,
    regulation_url: null,
    min_members: 3,
    max_members: 5,
    published_at: status === 'SETUP' ? null : STAMP,
    closed_at: null,
    created_at: STAMP,
    updated_at: STAMP,
  };
}

/** Início às 00h00 e prazos às 23h59 de Brasília (UTC-3). */
const start = (day: string) => new Date(`${day}T00:00:00-03:00`).toISOString();
const end = (day: string) => new Date(`${day}T23:59:00-03:00`).toISOString();

function stage(
  id: number,
  editionId: number,
  order: number,
  name: string,
  days: [string, string, string],
  maxScore: string,
): Stage {
  return {
    id,
    edition_id: editionId,
    order,
    name,
    kind: 'SUBMISSION',
    starts_at: start(days[0]),
    ends_at: end(days[1]),
    evaluation_ends_at: end(days[2]),
    scored: true,
    max_score: maxScore,
    min_evaluations: 1,
    submission_fields: [],
    created_at: STAMP,
    updated_at: STAMP,
  };
}

/** Linhas dos níveis (Insuficiente → Excelente), no formato lido por lib/rubric.ts. */
const levels = (lines: string[]) =>
  ['Insuficiente', 'Em desenvolvimento', 'Adequado', 'Excelente']
    .slice(0, lines.length)
    .map((label, index) => `${label} ${lines[index]}`)
    .join('\n');

function criterion(id: number, editionId: number, name: string, rubric: string): Criterion {
  return {
    id,
    edition_id: editionId,
    name,
    rubric,
    tiebreak_order: null,
    created_at: STAMP,
    updated_at: STAMP,
  };
}

interface EvaluationSetupState {
  editions: AdminEdition[];
  stages: Stage[];
  criteria: Criterion[];
  /** Critérios de cada etapa (chave: id da etapa). */
  links: Record<number, StageCriteriaItem[]>;
}

export function buildEvaluationSetup(): EvaluationSetupState {
  const e = SETUP_EDITION_ID;
  return {
    editions: [edition(e, 2027, 1, 'SETUP'), edition(PUBLISHED_EDITION_ID, 2026, 1, 'PUBLISHED')],
    stages: [
      stage(71, e, 1, 'Ideação', ['2027-03-01', '2027-03-19', '2027-03-21'], '2.00'),
      stage(72, e, 2, 'Desenvolvimento', ['2027-03-22', '2027-04-30', '2027-05-02'], '3.00'),
      stage(73, e, 3, 'Entrega', ['2027-05-03', '2027-05-14', '2027-05-28'], '3.00'),
      stage(74, e, 4, 'Apresentação', ['2027-06-14', '2027-06-18', '2027-06-25'], '2.00'),
      stage(
        31,
        PUBLISHED_EDITION_ID,
        1,
        'Entrega Preliminar',
        ['2026-04-01', '2026-04-20', '2026-04-27'],
        '10.00',
      ),
    ],
    criteria: [
      criterion(
        701,
        e,
        'Problema e relevância',
        `Delimita o problema e mostra por que ele importa.\n\n${levels([
          '(0,0): Problema vago ou sem relação com o desafio.',
          '(0,8): Problema identificado sem evidências.',
          '(1,4): Problema claro com evidências parciais.',
          '(2,0): Problema delimitado, relevante e fundamentado.',
        ])}`,
      ),
      criterion(
        702,
        e,
        'Solução e viabilidade',
        `Avalia a proposta de solução e a capacidade de executá-la.\n\n${levels([
          '(0,0): Solução ausente ou inviável.',
          '(1,0): Solução descrita sem plano de execução.',
          '(2,0): Solução viável com riscos mapeados.',
          '(3,0): Solução viável, testada e com plano consistente.',
        ])}`,
      ),
      criterion(
        703,
        e,
        'Resultado e evidências',
        `Resultados alcançados e evidências do impacto.\n\n${levels([
          '(0,0): Sem resultados apresentados.',
          '(1,5): Resultados parciais.',
        ])}`,
      ),
      criterion(
        704,
        e,
        'Clareza da apresentação',
        `Apresenta problema, solução e resultados com sequência clara e linguagem acessível.\n\n${levels(
          [
            '(0,0): Sem sequência compreensível.',
            '(0,3): Ideias dispersas; conexão parcial.',
            '(0,6): Sequência clara com pequenas lacunas.',
            '(0,8): Síntese clara do problema, solução e impacto.',
          ],
        )}`,
      ),
      criterion(
        705,
        e,
        'Domínio da proposta',
        `Segurança ao explicar as escolhas do projeto.\n\n${levels([
          '(0,0): Não explica as escolhas.',
          '(0,3): Explica parte da proposta.',
          '(0,6): Justifica decisões com evidências.',
        ])}`,
      ),
      criterion(
        706,
        e,
        'Respostas à banca',
        `Qualidade das respostas às perguntas da banca.\n\n${levels([
          '(0,0): Não responde às perguntas.',
          '(0,1): Respostas parciais ou vagas.',
          '(0,3): Responde de modo pertinente.',
          '(0,4): Respostas consistentes e fundamentadas.',
        ])}`,
      ),
      criterion(
        301,
        PUBLISHED_EDITION_ID,
        'Inovação',
        'Avalia o grau de originalidade da solução.',
      ),
    ],
    links: {
      71: [{ criterion_id: 701, max_score: '2.00' }],
      72: [{ criterion_id: 702, max_score: '3.00' }],
      73: [{ criterion_id: 703, max_score: '3.00' }],
      74: [
        { criterion_id: 704, max_score: '0.80' },
        { criterion_id: 705, max_score: '0.80' },
        { criterion_id: 706, max_score: '0.40' },
      ],
      31: [{ criterion_id: 301, max_score: '10.00' }],
    },
  };
}

/** StageCriterion[] da etapa, no formato de GET /api/admin/stages/{id}/criteria. */
export function toStageCriteria(state: EvaluationSetupState, stageId: number): StageCriterion[] {
  return (state.links[stageId] ?? []).map((item) => ({
    id: stageId * 100 + item.criterion_id,
    criterion: {
      id: item.criterion_id,
      name: state.criteria.find((c) => c.id === item.criterion_id)?.name ?? '',
    },
    max_score: item.max_score,
  }));
}
