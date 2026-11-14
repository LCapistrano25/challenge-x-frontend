import { fetchCurrentEdition, fetchPublicProjects } from './public.api';

describe('public.api (API simulada)', () => {
  it('retorna a edição vigente com edital e cronograma', async () => {
    const current = await fetchCurrentEdition();

    expect(current.edition.year).toBeGreaterThan(2000);
    expect(current.stages.length).toBeGreaterThan(0);
  });

  it('respeita page_size na vitrine de projetos', async () => {
    const page = await fetchPublicProjects({ page_size: 2 });

    expect(page.results).toHaveLength(2);
    expect(page.count).toBeGreaterThanOrEqual(2);
    expect(page.results[0]?.sdg).toHaveProperty('number');
  });
});
