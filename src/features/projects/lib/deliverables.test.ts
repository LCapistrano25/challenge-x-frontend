import {
  countPendingActions,
  describeFormats,
  describePendingActions,
  describeProjectHistory,
  describeRequirements,
  describeResubmission,
  describeStageMaterial,
  formatDeadline,
  formatFileSize,
  getProjectMetrics,
  getStageView,
  stagePosition,
} from './deliverables';
import type { DeliverableVersion, Project, StageDeliverable } from '../types';

// 20/04/2027 às 16:30 em Brasília (UTC−3).
const NOW = new Date('2027-04-20T19:30:00Z');

const version = (id: number, number: number): DeliverableVersion => ({
  id,
  version_number: number,
  submitted_by: { user_id: 'u1', name: 'Ana Maria' },
  submitted_at: '2027-03-30T19:42:00Z',
  notes: null,
  items: [
    {
      id: id * 10,
      field_id: 1,
      type: 'FILE',
      link: null,
      file_url: null,
      file_name: 'diagnostico_agroconecta_v1.pdf',
      size_bytes: 2.4 * 1024 * 1024,
    },
  ],
  receipt: null,
});

function stage(
  id: number,
  starts: string,
  ends: string,
  extra: Partial<StageDeliverable> = {},
): StageDeliverable {
  return {
    stage: {
      id,
      position: id,
      name: `Etapa ${id}`,
      type: 'EVALUATION',
      starts_at: starts,
      ends_at: ends,
      scored: true,
      points_value: '2.50',
      phase_status: 'OPEN',
    },
    fields: [
      {
        id: 1,
        type: 'FILE',
        label: 'Material',
        required: true,
        formats: 'pdf,zip',
        max_size_mb: 20,
      },
      {
        id: 2,
        type: 'LINK',
        label: 'Link do protótipo',
        required: true,
        formats: null,
        max_size_mb: null,
      },
    ],
    status: 'NOT_SUBMITTED',
    official_version_id: null,
    versions: [],
    ...extra,
  };
}

const approved = stage(1, '2027-03-01T03:00:00Z', '2027-04-01T02:59:00Z', {
  versions: [version(11, 1)],
  review: {
    status: 'APPROVED',
    version_id: 11,
    comment: null,
    resubmission_deadline: null,
    reviewed_at: '2027-04-02T12:00:00Z',
  },
});
const changes = stage(2, '2027-04-01T03:00:00Z', '2027-04-19T02:59:00Z', {
  versions: [version(22, 2), version(21, 1)],
  review: {
    status: 'CHANGES_REQUESTED',
    version_id: 22,
    comment: 'detalhar os indicadores de impacto.',
    resubmission_deadline: '2027-04-24T02:59:00Z',
    reviewed_at: '2027-04-18T12:00:00Z',
  },
});
const open = stage(3, '2027-04-19T03:00:00Z', '2027-05-16T02:59:00Z');
const upcoming = stage(4, '2027-05-16T03:00:00Z', '2027-05-26T02:59:00Z');
const items = [approved, changes, open, upcoming];

describe('deliverables — situação das etapas', () => {
  it('deriva Aprovada, Ajustes solicitados, Em andamento e Em breve', () => {
    expect(getStageView(approved, NOW)).toMatchObject({ status: 'APPROVED', canSubmit: false });
    expect(getStageView(changes, NOW)).toMatchObject({
      status: 'CHANGES_REQUESTED',
      canSubmit: true,
      action: { kind: 'submit', label: 'Atualizar entrega', primary: false },
    });
    expect(getStageView(open, NOW)).toMatchObject({
      status: 'OPEN',
      canSubmit: true,
      action: { kind: 'submit', label: 'Enviar entrega', primary: true },
    });
    expect(getStageView(upcoming, NOW)).toMatchObject({
      status: 'UPCOMING',
      canSubmit: false,
      action: { kind: 'details', label: 'Ver orientações' },
    });
    expect(getStageView(approved, NOW).action.label).toBe('Consultar envio');
  });

  it('envio sem parecer fica aguardando avaliação; um novo envio limpa o parecer anterior', () => {
    const sent = { ...open, versions: [version(31, 1)] };
    expect(getStageView(sent, NOW)).toMatchObject({
      status: 'AWAITING_REVIEW',
      canSubmit: true,
      action: { label: 'Atualizar entrega' },
    });
    const resent = { ...changes, versions: [version(23, 3), ...changes.versions] };
    expect(getStageView(resent, NOW).status).toBe('AWAITING_REVIEW');
  });

  it('sem envio e com prazo encerrado, a etapa fica não entregue', () => {
    const missed = stage(5, '2027-03-01T03:00:00Z', '2027-04-01T02:59:00Z');
    expect(getStageView(missed, NOW)).toMatchObject({ status: 'NOT_DELIVERED', canSubmit: false });
    expect(describeStageMaterial(missed, getStageView(missed, NOW)).detail).toBe(
      'Prazo encerrado em 31/03/2027 · 23:59',
    );
  });

  it('o reenvio só vale até o prazo autorizado', () => {
    const late = new Date('2027-04-25T12:00:00Z');
    expect(getStageView(changes, late)).toMatchObject({
      canSubmit: false,
      action: { label: 'Consultar envio' },
    });
    expect(describeResubmission(changes, getStageView(changes, NOW))).toBe(
      'Parecer da orientação: detalhar os indicadores de impacto. Reenvio autorizado até 23/04/2027, às 23:59.',
    );
  });

  it('descreve o material e as etapas futuras com a data de abertura', () => {
    expect(describeStageMaterial(approved, getStageView(approved, NOW))).toEqual({
      title: 'diagnostico_agroconecta_v1.pdf · 2,4 MB',
      detail: 'Enviado por Ana Maria em 30/03, às 16:42 · Versão 1',
    });
    expect(describeStageMaterial(open, getStageView(open, NOW))).toEqual({
      title: 'Nenhum arquivo enviado',
      detail: 'Envio aberto · PDF ou ZIP, até 20 MB · Link do protótipo obrigatório',
    });
    expect(describeStageMaterial(upcoming, getStageView(upcoming, NOW)).detail).toMatch(
      /^Envio disponível a partir de 16\/05\/2027/,
    );
  });
});

describe('deliverables — indicadores', () => {
  it('conta aprovadas, ajustes e o prazo da etapa atual', () => {
    expect(getProjectMetrics(items, NOW)).toEqual([
      { value: '1 de 4', label: 'entregas aprovadas' },
      { value: '1 ajuste', label: 'aguardando reenvio até 23/04' },
      { value: '15/05', label: 'prazo de Etapa 3' },
    ]);
    expect(countPendingActions(items, NOW)).toBe(2);
    expect(describePendingActions(1)).toBe('1 ação pendente da equipe');
    expect(describePendingActions(0)).toBe('Nenhuma ação pendente');
    expect(stagePosition(items, 3)).toEqual({ index: 3, total: 4 });
  });
});

describe('deliverables — formatação', () => {
  it('formata datas no horário de Brasília, tamanhos e formatos', () => {
    expect(formatDeadline('2027-04-01T02:59:00Z')).toBe('31/03/2027 · 23:59');
    expect(formatFileSize(1.8 * 1024 * 1024)).toBe('1,8 MB');
    expect(formatFileSize(500 * 1024)).toBe('500 KB');
    expect(describeFormats('pdf')).toBe('PDF');
    expect(describeFormats('pdf, zip, docx')).toBe('PDF, ZIP ou DOCX');
    expect(describeRequirements(open.fields)).toBe(
      'PDF ou ZIP, até 20 MB · Link do protótipo obrigatório',
    );
  });

  it('descreve o histórico de cadastro e edição do projeto', () => {
    const project = {
      created_at: '2027-03-12T13:00:00Z',
      updated_at: '2027-04-16T18:10:00Z',
      updated_by: { user_id: 'u1', name: 'Ana Maria' },
    } as Project;
    expect(describeProjectHistory(project)).toBe(
      'Cadastro em 12/03/2027 · Última edição por Ana Maria em 16/04/2027, às 15:10',
    );
    expect(describeProjectHistory({ ...project, updated_at: project.created_at })).toBe(
      'Cadastro em 12/03/2027',
    );
  });
});
