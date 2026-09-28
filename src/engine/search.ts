/**
 * Global search engine.
 * Queries across all major entities in the database.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

export type SearchResultType =
  | 'task'
  | 'book'
  | 'roadmap'
  | 'exercise'
  | 'routine'
  | 'article';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  route: string; // The expo-router path to view this item
}

export async function performGlobalSearch(
  db: SQLiteDatabase,
  query: string
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const pattern = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  // 1. Tasks
  const tasks = await db.getAllAsync<{ id: string; title: string; description: string | null }>(
    `SELECT id, title, description FROM task 
     WHERE title LIKE ? OR description LIKE ? 
     LIMIT 10`,
    pattern, pattern
  );
  tasks.forEach((t) => {
    results.push({
      id: t.id,
      type: 'task',
      title: t.title,
      subtitle: t.description || undefined,
      route: `/task/${t.id}`,
    });
  });

  // 2. Books
  const books = await db.getAllAsync<{ id: string; title: string; author: string | null }>(
    `SELECT id, title, author FROM book 
     WHERE title LIKE ? OR author LIKE ? OR notes LIKE ? 
     LIMIT 10`,
    pattern, pattern, pattern
  );
  books.forEach((b) => {
    results.push({
      id: b.id,
      type: 'book',
      title: b.title,
      subtitle: b.author || 'Unknown Author',
      route: `/book/${b.id}`,
    });
  });

  // 3. Roadmaps & Roadmap Items
  const roadmaps = await db.getAllAsync<{ id: string; name: string; description: string | null }>(
    `SELECT id, name, description FROM roadmap 
     WHERE name LIKE ? OR description LIKE ? 
     LIMIT 10`,
    pattern, pattern
  );
  roadmaps.forEach((r) => {
    results.push({
      id: r.id,
      type: 'roadmap',
      title: r.name,
      subtitle: r.description || undefined,
      route: `/roadmap/${r.id}`,
    });
  });

  const roadmapItems = await db.getAllAsync<{ id: string; roadmap_id: string; title: string; notes: string | null }>(
    `SELECT id, roadmap_id, title, notes FROM roadmap_item 
     WHERE title LIKE ? OR notes LIKE ? 
     LIMIT 10`,
    pattern, pattern
  );
  roadmapItems.forEach((ri) => {
    // Avoid duplicates if we already matched the roadmap itself (simplification)
    if (!results.find(r => r.type === 'roadmap' && r.id === ri.roadmap_id)) {
      results.push({
        id: ri.roadmap_id,
        type: 'roadmap',
        title: `Roadmap Step: ${ri.title}`,
        subtitle: ri.notes || undefined,
        route: `/roadmap/${ri.roadmap_id}`,
      });
    }
  });

  // 4. Exercises
  const exercises = await db.getAllAsync<{ id: string; name: string; notes: string | null }>(
    `SELECT id, name, notes FROM exercise 
     WHERE name LIKE ? OR notes LIKE ? 
     LIMIT 10`,
    pattern, pattern
  );
  exercises.forEach((e) => {
    results.push({
      id: e.id,
      type: 'exercise',
      title: e.name,
      subtitle: e.notes || undefined,
      route: `/exercise/${e.id}`,
    });
  });

  // 5. Routines
  const routines = await db.getAllAsync<{ id: string; name: string }>(
    `SELECT id, name FROM routine 
     WHERE name LIKE ? 
     LIMIT 10`,
    pattern
  );
  routines.forEach((r) => {
    results.push({
      id: r.id,
      type: 'routine',
      title: r.name,
      subtitle: 'Routine',
      route: `/routine/${r.id}`,
    });
  });

  // 6. Articles
  const articles = await db.getAllAsync<{ id: string; title: string; summary: string | null }>(
    `SELECT id, title, summary FROM article 
     WHERE title LIKE ? OR summary LIKE ? OR content LIKE ? 
     LIMIT 20`,
    pattern, pattern, pattern
  );
  articles.forEach((a) => {
    results.push({
      id: a.id,
      type: 'article',
      title: a.title,
      subtitle: a.summary || undefined,
      route: `/reader/${a.id}`,
    });
  });

  return results;
}
