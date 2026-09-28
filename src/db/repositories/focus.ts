/**
 * FocusSession repository implementation.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { FocusSession, FocusMode } from '../../types/models';
import type { FocusSessionRepository } from './types';
import { generateId, nowISO } from '../../utils/date';

export function createFocusSessionRepository(db: SQLiteDatabase): FocusSessionRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<FocusSessionRow>('SELECT * FROM focus_session ORDER BY started_at DESC');
      return rows.map(mapRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<FocusSessionRow>('SELECT * FROM focus_session WHERE id = ?', id);
      return row ? mapRow(row) : null;
    },

    async create(session) {
      const id = generateId();
      const createdAt = nowISO();

      await db.runAsync(
        `INSERT INTO focus_session (
          id, category_id, task_id, mode, target_duration, started_at, finished_at, actual_duration, quality_rating, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        session.categoryId ?? null,
        session.taskId ?? null,
        session.mode,
        session.targetDuration ?? null,
        session.startedAt,
        session.finishedAt ?? null,
        session.actualDuration ?? null,
        session.qualityRating ?? null,
        session.notes ?? null,
        createdAt,
      );

      return {
        id,
        ...session,
        createdAt,
      };
    },

    async update(id, updates) {
      const current = await this.getById(id);
      if (!current) return null;

      const merged = { ...current, ...updates };

      await db.runAsync(
        `UPDATE focus_session SET 
          category_id = ?, task_id = ?, mode = ?, target_duration = ?, started_at = ?, finished_at = ?, actual_duration = ?, quality_rating = ?, notes = ?
         WHERE id = ?`,
        merged.categoryId ?? null,
        merged.taskId ?? null,
        merged.mode,
        merged.targetDuration ?? null,
        merged.startedAt,
        merged.finishedAt ?? null,
        merged.actualDuration ?? null,
        merged.qualityRating ?? null,
        merged.notes ?? null,
        id,
      );

      return merged;
    },

    async delete(id) {
      await db.runAsync('DELETE FROM focus_session WHERE id = ?', id);
    },
  };
}

interface FocusSessionRow {
  id: string;
  category_id: string | null;
  task_id: string | null;
  mode: string;
  target_duration: number | null;
  started_at: string;
  finished_at: string | null;
  actual_duration: number | null;
  quality_rating: number | null;
  notes: string | null;
  created_at: string;
}

function mapRow(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    categoryId: row.category_id,
    taskId: row.task_id,
    mode: row.mode as FocusMode,
    targetDuration: row.target_duration,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    actualDuration: row.actual_duration,
    qualityRating: row.quality_rating,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
