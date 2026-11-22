import type { DeliverableField } from '@/features/projects';
import {
  acceptAttribute,
  describeDeliveryError,
  describeSelectedFile,
  emptyCanvas,
  emptySwot,
  isValidHttpsUrl,
  toSubmissionBody,
  toSubmissionFormData,
  validateDelivery,
  validateFile,
} from './submission';

const MB = 1024 * 1024;
const fileField: DeliverableField = {
  id: 1,
  type: 'FILE',
  label: 'Material da entrega',
  required: true,
  formats: 'pdf,zip',
  max_size_mb: 20,
};
const linkField: DeliverableField = {
  id: 2,
  type: 'LINK',
  label: 'Link do protótipo',
  required: true,
  formats: null,
  max_size_mb: null,
};

const fileOf = (name: string, size: number) => {
  const file = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('submission — validação', () => {
  it('aceita só os formatos e o tamanho da etapa', () => {
    expect(acceptAttribute(fileField)).toBe('.pdf,.zip');
    expect(validateFile(fileOf('prototipo.PDF', 4.8 * MB), fileField)).toBeNull();
    expect(validateFile(fileOf('prototipo.docx', MB), fileField)).toBe(
      'Formato não aceito. Envie um arquivo PDF ou ZIP.',
    );
    expect(validateFile(fileOf('grande.zip', 21 * MB), fileField)).toBe(
      'O arquivo tem 21,0 MB. O limite é 20 MB.',
    );
    expect(describeSelectedFile(fileOf('prototipo.pdf', 4.8 * MB))).toBe(
      '4,8 MB · PDF · Pronto para enviar',
    );
  });

  it('exige link completo com https://', () => {
    expect(isValidHttpsUrl('https://agroconecta.netlify.app/prototipo')).toBe(true);
    expect(isValidHttpsUrl('http://agroconecta.netlify.app')).toBe(false);
    expect(isValidHttpsUrl('agroconecta.netlify.app')).toBe(false);
    expect(isValidHttpsUrl('https://localhost')).toBe(false);
  });

  it('valida os campos obrigatórios da etapa', () => {
    expect(validateDelivery([fileField, linkField], { files: {}, links: {}, notes: '' })).toEqual({
      1: 'Selecione o arquivo da entrega.',
      2: 'Informe o link do protótipo.',
    });
    expect(
      validateDelivery([fileField, linkField], {
        files: { 1: fileOf('a.pdf', MB) },
        links: { 2: 'www.site.com' },
        notes: '',
      }),
    ).toEqual({ 2: 'Informe um endereço completo, começando com https://.' });
  });
});

describe('submission — corpo multipart', () => {
  it('monta items em JSON, files[] e notes (P-43)', () => {
    const file = fileOf('prototipo.pdf', MB);
    const body = toSubmissionFormData([fileField, linkField], {
      files: { 1: file },
      links: { 2: ' https://agroconecta.netlify.app ' },
      notes: '  Inclui o link do protótipo. ',
    });
    expect(JSON.parse(String(body.get('items')))).toEqual([
      { field_id: 1, file_index: 0 },
      { field_id: 2, link: 'https://agroconecta.netlify.app' },
    ]);
    expect((body.getAll('files')[0] as File).name).toBe('prototipo.pdf');
    expect(body.get('notes')).toBe('Inclui o link do protótipo.');
  });

  it('valida campos CANVAS e SWOT obrigatorios e monta corpo JSON sem arquivos', () => {
    const canvasField: DeliverableField = {
      id: 3,
      type: 'CANVAS',
      label: 'Business Model Canvas',
      required: true,
      formats: null,
      max_size_mb: null,
    };
    const swotField: DeliverableField = {
      id: 4,
      type: 'SWOT',
      label: 'Matriz SWOT',
      required: true,
      formats: null,
      max_size_mb: null,
    };

    const missing = validateDelivery([canvasField, swotField], {
      files: {},
      links: {},
      canvas: { 3: emptyCanvas() },
      swot: { 4: emptySwot() },
      notes: '',
    });
    expect(missing[3]).toBeDefined();
    expect(missing[4]).toBeDefined();

    const canvas = emptyCanvas();
    for (const key of Object.keys(canvas) as (keyof typeof canvas)[]) {
      canvas[key] = `Texto ${key}`;
    }
    const swot = {
      strengths: ['Equipe multidisciplinar', ''],
      weaknesses: ['Tempo curto'],
      opportunities: ['Parcerias locais'],
      threats: ['Custos logísticos'],
    };

    expect(
      validateDelivery([canvasField, swotField, linkField], {
        files: {},
        links: { 2: 'https://agroconecta.netlify.app' },
        canvas: { 3: canvas },
        swot: { 4: swot },
        notes: ' Entrega JSON ',
      }),
    ).toEqual({});

    const body = toSubmissionBody([linkField, canvasField, swotField], {
      files: {},
      links: { 2: 'https://agroconecta.netlify.app' },
      canvas: { 3: canvas },
      swot: { 4: swot },
      notes: ' Entrega JSON ',
    });
    expect(body).not.toBeInstanceOf(FormData);
    expect(body).toEqual({
      items: [
        { field_id: 2, link: 'https://agroconecta.netlify.app' },
        { field_id: 3, content: canvas },
        {
          field_id: 4,
          content: {
            strengths: ['Equipe multidisciplinar'],
            weaknesses: ['Tempo curto'],
            opportunities: ['Parcerias locais'],
            threats: ['Custos logísticos'],
          },
        },
      ],
      notes: 'Entrega JSON',
    });
  });

  it('usa mensagem genérica para erros fora do contrato', () => {
    expect(describeDeliveryError(new Error('rede'))).toBe(
      'Não foi possível enviar a entrega. Tente novamente.',
    );
  });
});
