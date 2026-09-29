import { getDatabase } from '../src/db/connection.web';
import { createRepositories } from '../src/db/repositories';
import { nowISO } from '../src/utils/date';

describe('Integration flows', () => {
  let repositories: ReturnType<typeof createRepositories>;

  beforeAll(async () => {
    const db = await getDatabase();
    repositories = createRepositories(db);
  });

  test('New Exercise -> appears in list', async () => {
    const initial = await repositories.exercises.getAll();
    await repositories.exercises.create({
      name: 'Integration Test Exercise',
      mode: 'count',
      categoryId: null,
      targetDuration: null,
      targetReps: 10,
      targetSets: 3,
      restDuration: 60,
      notes: null,
    });
    const final = await repositories.exercises.getAll();
    expect(final.length).toBe(initial.length + 1);
    expect(final.find(e => e.name === 'Integration Test Exercise')).toBeDefined();
  });

  test('New Routine -> appears in list', async () => {
    const initial = await repositories.routines.getAll();
    await repositories.routines.create({
      name: 'Integration Test Routine',
      exerciseIds: ['dummy-id'],
    });
    const final = await repositories.routines.getAll();
    expect(final.length).toBe(initial.length + 1);
    expect(final.find(r => r.name === 'Integration Test Routine')).toBeDefined();
  });

  test('New Task -> appears in list', async () => {
    const initial = await repositories.tasks.getAll();
    await repositories.tasks.create({
      title: 'Integration Test Task',
      description: null,
      dueDate: nowISO(),
      priority: 'medium',
      status: 'pending',
    } as any);
    const final = await repositories.tasks.getAll();
    expect(final.length).toBe(initial.length + 1);
    expect(final.find(t => t.title === 'Integration Test Task')).toBeDefined();
  });

  test('New Book -> appears in list', async () => {
    const initial = await repositories.books.getAll();
    await repositories.books.create({
      title: 'Integration Test Book',
      author: 'Author',
      status: 'want_to_read',
      totalPages: null,
      currentPage: 0,
      rating: null,
      startDate: null,
      finishDate: null,
      notes: null,
      coverColor: null,
    });
    const final = await repositories.books.getAll();
    expect(final.length).toBe(initial.length + 1);
    expect(final.find(b => b.title === 'Integration Test Book')).toBeDefined();
  });

  test('New Feed -> appears in list', async () => {
    const initial = await repositories.feedSources.getAll();
    await repositories.feedSources.create({
      title: 'Integration Test Feed',
      url: 'https://example.com/feed.xml',
      siteUrl: null,
      lastFetched: null,
    });
    const final = await repositories.feedSources.getAll();
    expect(final.length).toBe(initial.length + 1);
    expect(final.find(f => f.title === 'Integration Test Feed')).toBeDefined();
  });
});
