import {
  toStudentPayload,
  toTeacherPayload,
  validateStudent,
  validateTeacher,
  type StudentFormValues,
} from './profile-validation';

const validStudent: StudentFormValues = {
  courseId: 'c1',
  registration: '2026001234',
  period: '3',
  acceptedTerms: true,
};

describe('validateStudent', () => {
  it('aceita dados completos', () => {
    expect(validateStudent(validStudent)).toEqual({});
  });

  it('exige todos os campos', () => {
    const errors = validateStudent({
      courseId: '',
      registration: '',
      period: '',
      acceptedTerms: false,
    });

    expect(Object.keys(errors).sort()).toEqual([
      'acceptedTerms',
      'courseId',
      'period',
      'registration',
    ]);
  });

  it.each(['12345', 'abc123456', '1234567890123456'])('rejeita matrícula inválida: %s', (value) => {
    expect(validateStudent({ ...validStudent, registration: value }).registration).toMatch(
      /apenas números/,
    );
  });
});

describe('validateTeacher', () => {
  it('aceita ao menos um curso e os termos', () => {
    expect(validateTeacher({ courseIds: ['c1'], acceptedTerms: true })).toEqual({});
  });

  it('exige curso e termos', () => {
    expect(validateTeacher({ courseIds: [], acceptedTerms: false })).toEqual({
      courseIds: 'Selecione ao menos um curso.',
      acceptedTerms: 'Você precisa aceitar os termos para continuar.',
    });
  });
});

describe('payloads', () => {
  it('converte o formulário do aluno', () => {
    expect(toStudentPayload({ ...validStudent, registration: ' 2026001234 ' })).toEqual({
      role: 'STUDENT',
      courseId: 'c1',
      registration: '2026001234',
      period: 3,
      acceptedTerms: true,
    });
  });

  it('converte o formulário do professor', () => {
    expect(toTeacherPayload({ courseIds: ['c1', 'c2'], acceptedTerms: true })).toEqual({
      role: 'TEACHER',
      courseIds: ['c1', 'c2'],
      acceptedTerms: true,
    });
  });
});
