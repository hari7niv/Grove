/**
 * Exercise, Routine, and ExerciseSession repository implementations.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Exercise, Routine, ExerciseSession } from '../../types/models';
import type {
  ExerciseRepository,
  RoutineRepository,
  ExerciseSessionRepository,
} from './types';
import { generateId, nowISO } from '../../utils/date';

// ─── Exercise Repository ────────────────────────────────────────

export function createExerciseRepository(db: SQLiteDatabase): ExerciseRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<ExerciseRow>('SELECT * FROM exercise');
      return rows.map(mapExerciseRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<ExerciseRow>(
        'SELECT * FROM exercise WHERE id = ?',
        id,
      );
      return row ? mapExerciseRow(row) : null;
    },

    async create(exercise) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO exercise (id, name, mode, category_id, target_duration, target_reps, target_sets, rest_duration, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        exercise.name,
        exercise.mode,
        exercise.categoryId,
        exercise.targetDuration,
        exercise.targetReps,
        exercise.targetSets,
        exercise.restDuration,
        exercise.notes,
        now,
        now,
      );

      return {
        id,
        ...exercise,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(id, updates) {
      const existing = await this.getById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: nowISO() };

      await db.runAsync(
        `UPDATE exercise SET name = ?, mode = ?, category_id = ?, target_duration = ?, target_reps = ?, target_sets = ?, rest_duration = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
        updated.name,
        updated.mode,
        updated.categoryId,
        updated.targetDuration,
        updated.targetReps,
        updated.targetSets,
        updated.restDuration,
        updated.notes,
        updated.updatedAt,
        id,
      );

      return updated;
    },

    async delete(id) {
      await db.runAsync('DELETE FROM exercise WHERE id = ?', id);
    },
  };
}

// ─── Routine Repository ─────────────────────────────────────────

export function createRoutineRepository(db: SQLiteDatabase): RoutineRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<RoutineRow>('SELECT * FROM routine');
      return rows.map(mapRoutineRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<RoutineRow>(
        'SELECT * FROM routine WHERE id = ?',
        id,
      );
      return row ? mapRoutineRow(row) : null;
    },

    async create(routine) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO routine (id, name, exercise_ids, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        id,
        routine.name,
        JSON.stringify(routine.exerciseIds),
        now,
        now,
      );

      return {
        id,
        ...routine,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(id, updates) {
      const existing = await this.getById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: nowISO() };

      await db.runAsync(
        `UPDATE routine SET name = ?, exercise_ids = ?, updated_at = ? WHERE id = ?`,
        updated.name,
        JSON.stringify(updated.exerciseIds),
        updated.updatedAt,
        id,
      );

      return updated;
    },

    async delete(id) {
      await db.runAsync('DELETE FROM routine WHERE id = ?', id);
    },
  };
}

// ─── ExerciseSession Repository ─────────────────────────────────

export function createExerciseSessionRepository(
  db: SQLiteDatabase,
): ExerciseSessionRepository {
  return {
    async getByExerciseId(exerciseId) {
      const rows = await db.getAllAsync<ExerciseSessionRow>(
        'SELECT * FROM exercise_session WHERE exercise_id = ? ORDER BY started_at DESC',
        exerciseId,
      );
      return rows.map(mapExerciseSessionRow);
    },

    async getByRoutineId(routineId) {
      const rows = await db.getAllAsync<ExerciseSessionRow>(
        'SELECT * FROM exercise_session WHERE routine_id = ? ORDER BY started_at DESC',
        routineId,
      );
      return rows.map(mapExerciseSessionRow);
    },

    async create(session) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO exercise_session (id, exercise_id, routine_id, started_at, finished_at, duration, sets_completed, reps_completed, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        session.exerciseId,
        session.routineId,
        session.startedAt,
        session.finishedAt,
        session.duration,
        session.setsCompleted,
        session.repsCompleted,
        session.notes,
        now,
      );

      return {
        id,
        ...session,
        createdAt: now,
      };
    },

    async update(id, updates) {
      const existingRow = await db.getFirstAsync<ExerciseSessionRow>(
        'SELECT * FROM exercise_session WHERE id = ?',
        id,
      );
      if (!existingRow) return null;

      const existing = mapExerciseSessionRow(existingRow);
      const updated = { ...existing, ...updates };

      await db.runAsync(
        `UPDATE exercise_session SET finished_at = ?, duration = ?, sets_completed = ?, reps_completed = ?, notes = ? WHERE id = ?`,
        updated.finishedAt,
        updated.duration,
        updated.setsCompleted,
        updated.repsCompleted,
        updated.notes,
        id,
      );

      return updated;
    },
  };
}

// ─── Internal types & mappers ───────────────────────────────────

interface ExerciseRow {
  id: string;
  name: string;
  mode: string;
  category_id: string | null;
  target_duration: number | null;
  target_reps: number | null;
  target_sets: number | null;
  rest_duration: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    mode: row.mode as Exercise['mode'],
    categoryId: row.category_id,
    targetDuration: row.target_duration,
    targetReps: row.target_reps,
    targetSets: row.target_sets,
    restDuration: row.rest_duration,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface RoutineRow {
  id: string;
  name: string;
  exercise_ids: string; // JSON string
  created_at: string;
  updated_at: string;
}

function mapRoutineRow(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    exerciseIds: JSON.parse(row.exercise_ids || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ExerciseSessionRow {
  id: string;
  exercise_id: string;
  routine_id: string | null;
  started_at: string;
  finished_at: string | null;
  duration: number | null;
  sets_completed: number | null;
  reps_completed: number | null;
  notes: string | null;
  created_at: string;
}

function mapExerciseSessionRow(row: ExerciseSessionRow): ExerciseSession {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    routineId: row.routine_id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    duration: row.duration,
    setsCompleted: row.sets_completed,
    repsCompleted: row.reps_completed,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
