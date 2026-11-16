import { fetchNotifications } from './notifications.api';

describe('notifications.api (API simulada)', () => {
  it('lista notificações paginadas', async () => {
    const page = await fetchNotifications({ page_size: 3 });

    expect(page.results.length).toBeLessThanOrEqual(3);
    expect(page.results[0]).toHaveProperty('read_at');
  });

  it('filtra só as não lidas', async () => {
    const page = await fetchNotifications({ unread: true });
    expect(page.results.every((n) => n.read_at === null)).toBe(true);
  });
});
