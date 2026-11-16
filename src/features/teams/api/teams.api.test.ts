import { getApiError } from '@/shared/lib/api-error';
import {
  cancelJoinRequest,
  createJoinRequest,
  createTeam,
  fetchAvailableTeams,
  fetchMyJoinRequests,
  findTeamByCode,
} from './teams.api';

describe('teams.api (API simulada)', () => {
  it('lista só equipes com vagas, no formato paginado', async () => {
    const page = await fetchAvailableTeams({ page_size: 10 });

    expect(page.count).toBe(3);
    expect(page.results.map((team) => team.name)).toEqual([
      'Raízes do Futuro',
      'Cidade em Rede',
      'EcoLab',
    ]);
    expect(page.results.every((team) => team.available_slots > 0)).toBe(true);
  });

  it('busca por nome e filtra por área', async () => {
    expect((await fetchAvailableTeams({ search: 'eco' })).results).toHaveLength(1);
    expect(
      (await fetchAvailableTeams({ interest_area: 'SOCIAL' })).results.map((t) => t.name),
    ).toEqual(['Cidade em Rede']);
  });

  it('localiza a equipe pelo código e ignora equipe lotada', async () => {
    expect((await findTeamByCode('dx27-rf21'))?.name).toBe('Raízes do Futuro');
    expect(await findTeamByCode('DX27-MF24')).toBeNull();
  });

  it('registra, impede duplicar e cancela a solicitação de entrada', async () => {
    const request = await createJoinRequest(21);
    expect(request).toMatchObject({ status: 'PENDING', team: { id: 21 } });

    const conflict = await createJoinRequest(21).catch((error: unknown) => error);
    expect(getApiError(conflict)).toMatchObject({
      status: 409,
      code: 'join_request_pending_exists',
    });

    const pending = await fetchMyJoinRequests('PENDING');
    expect(pending.map((r) => r.team.id)).toEqual(expect.arrayContaining([21, 23]));

    expect((await cancelJoinRequest(request.id)).status).toBe('CANCELLED');
    expect((await fetchMyJoinRequests('PENDING')).map((r) => r.team.id)).not.toContain(21);
  });

  it('cria a equipe e recusa nome repetido', async () => {
    const taken = await createTeam({ name: 'EcoLab' }).catch((error: unknown) => error);
    expect(getApiError(taken)?.code).toBe('team_name_taken');

    const team = await createTeam({
      name: 'Nova Equipe',
      interest_area: 'EDUCATION',
      description: 'Apresentação.',
    });
    expect(team.members).toEqual([expect.objectContaining({ role: 'LEADER' })]);
  });
});
