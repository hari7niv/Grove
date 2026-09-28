import { setupTestRepositories } from './utils/db-test-utils';
import type { Repositories } from '../src/db/repositories/index';
import { nowISO } from '../src/utils/date';

describe('Repository Integration Tests', () => {
  let repos: Repositories;

  beforeEach(async () => {
    repos = await setupTestRepositories() as unknown as Repositories;
  });

  describe('Categories', () => {
    it('creates, reads, and deletes categories', async () => {
      const cat = await repos.categories.create({
        name: 'Test Category',
        color: '#ff0000',
        icon: 'test',
        plantType: 'oak',
        sortOrder: 1,
      });

      expect(typeof cat.id).toBe('string');
      let cats = await repos.categories.getAll();
      const match = cats.find(c => c.id === cat.id);
      expect(match).toBeDefined();
      expect(match?.name).toBe('Test Category');

      await repos.categories.update(cat.id, { name: 'Updated' });
      const updated = await repos.categories.getById(cat.id);
      expect(updated?.name).toBe('Updated');

      await repos.categories.delete(cat.id);
      cats = await repos.categories.getAll();
      expect(cats.find(c => c.id === cat.id)).toBeUndefined();
    });
  });

  describe('Tasks', () => {
    it('creates and reads tasks', async () => {
      const task = await repos.tasks.create({
        title: 'Do laundry',
        description: null,
        priority: 'high',
        dueDate: '2026-09-28',
        dueTime: null,
        status: 'pending',
        tags: [],
        categoryId: null,
        parentId: null,
        recurrenceRule: null,
        completedAt: null,
      });

      const tasks = await repos.tasks.getAll();
      expect(tasks.find(t => t.id === task.id)).toBeDefined();
    });
  });

  describe('Activity Logs', () => {
    it('creates and fetches logs by date range', async () => {
      const cats = await repos.categories.getAll();
      const habits = await repos.habits.getAll();
      const catId = cats[0].id;
      const habitId = habits[0].id;

      await repos.activityLogs.create({
        logicalDate: '2026-09-28',
        timestamp: nowISO(),
        type: 'task',
        categoryId: catId,
        habitId: habitId,
        value: 1,
        unit: null,
        metadata: null,
      });

      const logs = await repos.activityLogs.getByDateRange('2026-09-28', '2026-09-28');
      expect(logs.find(l => l.type === 'task')).toBeDefined();
    });
  });
});
