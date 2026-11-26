import {
  EMPTY_PROJECT_FORM,
  describeFillStatus,
  describeTeamComposition,
  firstInvalidField,
  fromProjectDraft,
  hasDraftContent,
  isProjectIncomplete,
  toProjectDraft,
  toProjectWrite,
  toSdgOptions,
  validateProjectDraft,
  validateProjectForm,
  type ProjectFormValues,
} from './project-registration';
import type { EligibleChallenge, Project } from '../types';

const filled: ProjectFormValues = {
  title: '  AgroConecta — da horta à comunidade ',
  categoryId: '1',
  challengeId: '17',
  summary: 'Plataforma digital para conectar agricultores familiares.',
  problem: 'Poucos canais digitais.',
  objective: 'Ampliar o acesso ao comércio local.',
  methodology: 'Entrevistas, protótipo e piloto.',
  targetAudience: 'Agricultores familiares',
  location: 'Campus sede',
  advisorName: '',
  advisorEmail: '',
  referenceUrl: '',
  accepted: true,
};

const challenge = (id: number, sdg: number, description: string): EligibleChallenge => ({
  id,
  description,
  course: { id: 1, name: 'Engenharia de Software' },
  sdg: { id: sdg, number: sdg, title: `Título ${sdg}` },
});

describe('validateProjectForm', () => {
  it('aceita o formulário completo', () => {
    expect(validateProjectForm(filled)).toEqual({});
  });

  it('aceita objetivo vazio (opcional no contrato)', () => {
    expect(validateProjectForm({ ...filled, objective: '' })).toEqual({});
  });

  it('exige desafio, título, resumo, categoria e a declaração', () => {
    const errors = validateProjectForm(EMPTY_PROJECT_FORM);
    expect(Object.keys(errors)).toEqual([
      'challengeId',
      'title',
      'summary',
      'categoryId',
      'accepted',
    ]);
    expect(firstInvalidField(errors)).toBe('challengeId');
  });

  it('não aceita espaços como preenchimento', () => {
    expect(validateProjectForm({ ...filled, summary: '   ' }).summary).toBe(
      'Escreva o resumo da proposta.',
    );
  });

  it('limita o título a 200 e o resumo a 1.000 caracteres', () => {
    const errors = validateProjectForm({
      ...filled,
      title: 'a'.repeat(201),
      summary: 'b'.repeat(1001),
    });
    expect(errors.title).toBe('O título deve ter até 200 caracteres.');
    expect(errors.summary).toBe('O resumo deve ter até 1.000 caracteres.');
    expect(validateProjectForm({ ...filled, title: 'a'.repeat(200) }).title).toBeUndefined();
  });

  it('limita problema, objetivo e metodologia a 1.000 caracteres', () => {
    const long = 'c'.repeat(1001);
    const errors = validateProjectForm({
      ...filled,
      problem: long,
      objective: long,
      methodology: long,
    });
    expect(errors.problem).toBe('O texto deve ter até 1.000 caracteres.');
    expect(errors.objective).toBe('O texto deve ter até 1.000 caracteres.');
    expect(errors.methodology).toBe('O texto deve ter até 1.000 caracteres.');
  });

  it('valida e-mail e link opcionais apenas quando preenchidos', () => {
    const errors = validateProjectForm({
      ...filled,
      advisorEmail: 'carla@',
      referenceUrl: 'github.com/equipe',
    });
    expect(errors.advisorEmail).toBe('Informe um e-mail válido.');
    expect(errors.referenceUrl).toMatch(/link válido/);
    expect(
      validateProjectForm({
        ...filled,
        advisorEmail: 'carla.mendes@universidade.edu.br',
        referenceUrl: 'https://github.com/conexaoverde/agroconecta',
      }),
    ).toEqual({});
  });
});

describe('rascunho e incompletude', () => {
  it('não exige obrigatórios nem a declaração', () => {
    expect(validateProjectDraft({ ...EMPTY_PROJECT_FORM, title: 'Ideia' })).toEqual({});
  });

  it('ainda valida o formato do que foi preenchido', () => {
    expect(validateProjectDraft({ ...EMPTY_PROJECT_FORM, advisorEmail: 'x' }).advisorEmail).toBe(
      'Informe um e-mail válido.',
    );
  });

  it('só considera conteúdo os campos de texto preenchidos', () => {
    expect(hasDraftContent({ ...EMPTY_PROJECT_FORM, accepted: true })).toBe(false);
    expect(hasDraftContent({ ...EMPTY_PROJECT_FORM, location: 'Campus' })).toBe(true);
  });

  it('envia campos vazios como null e volta ao formulário', () => {
    const draft = toProjectDraft({ ...EMPTY_PROJECT_FORM, title: ' Ideia ', challengeId: '17' });
    expect(draft).toMatchObject({
      title: 'Ideia',
      challenge_id: 17,
      category_id: null,
      summary: null,
    });
    expect(fromProjectDraft(draft)).toMatchObject({
      title: 'Ideia',
      challengeId: '17',
      categoryId: '',
    });
  });

  it('descarta desafio e categoria que deixaram de ser elegíveis', () => {
    const values = fromProjectDraft(
      { challenge_id: 99, category_id: 1 },
      {
        challenges: [challenge(17, 11, 'x')],
        categories: [{ id: 1, name: 'A', description: null }],
      },
    );
    expect(values.challengeId).toBe('');
    expect(values.categoryId).toBe('1');
  });

  it('formulário vazio sem rascunho', () => {
    expect(fromProjectDraft(null)).toEqual(EMPTY_PROJECT_FORM);
  });

  it('identifica projeto incompleto quando falta desafio, título, resumo ou categoria', () => {
    const base: Project = {
      id: 1,
      team_id: 12,
      edition_id: 3,
      challenge: challenge(17, 11, 'Descrição'),
      category: { id: 1, name: 'Categoria' },
      title: 'Título',
      summary: 'Resumo',
      objective: '',
      status: 'IN_PROGRESS',
      courses: [],
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z',
    };
    expect(isProjectIncomplete(base)).toBe(false);
    expect(isProjectIncomplete({ ...base, challenge: null })).toBe(true);
    expect(isProjectIncomplete({ ...base, title: '' })).toBe(true);
    expect(isProjectIncomplete({ ...base, summary: '' })).toBe(true);
    expect(isProjectIncomplete({ ...base, category: null })).toBe(true);
  });
});

describe('toProjectWrite', () => {
  it('monta o corpo dos passos com ids numéricos e textos aparados', () => {
    expect(toProjectWrite(filled)).toEqual({
      challenge_id: 17,
      category_id: 1,
      title: 'AgroConecta — da horta à comunidade',
      summary: 'Plataforma digital para conectar agricultores familiares.',
      objective: 'Ampliar o acesso ao comércio local.',
    });
  });
});

describe('toSdgOptions', () => {
  it('lista os desafios pela ODS, em ordem numérica', () => {
    expect(toSdgOptions([challenge(17, 11, 'Comércio'), challenge(15, 6, 'Água')])).toEqual([
      { value: '15', label: 'ODS 6 · Título 6' },
      { value: '17', label: 'ODS 11 · Título 11' },
    ]);
  });

  it('diferencia desafios com a mesma ODS pela descrição', () => {
    const labels = toSdgOptions([challenge(1, 11, 'Mobilidade'), challenge(2, 11, 'Comércio')]).map(
      (option) => option.label,
    );
    expect(labels).toEqual(['ODS 11 · Título 11 — Comércio', 'ODS 11 · Título 11 — Mobilidade']);
  });
});

describe('textos', () => {
  it('descreve a situação do preenchimento', () => {
    expect(describeFillStatus(null)).toBe('Preenchimento em andamento · Ainda não cadastrado');
    expect(describeFillStatus('2026-11-15T13:05:00')).toMatch(
      /^Rascunho salvo às \d{2}:\d{2} · Ainda não cadastrado$/,
    );
  });

  it('descreve a composição da equipe como no Figma', () => {
    expect(
      describeTeamComposition(
        ['Engenharia de Software', 'Engenharia de Software', 'Agronomia', 'Agronomia'],
        4,
      ),
    ).toBe('4 integrantes · Engenharia de Software e Agronomia');
    expect(describeTeamComposition(['Direito'], 1)).toBe('1 integrante · Direito');
  });
});
