/**
 * ActivityLog repository implementation using expo-sqlite.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { ActivityLog, DayActivity } from '../../types/models';
import type { ActivityLogRepository } from './types';
import { generateId, nowISO } from '../../utils/date';

export function createActivityLogRepository(db: SQLiteDatabase): ActivityLogRepository {
  return {
    async create(entry) {
      const id = generateId();
      const createdAt = nowISO();

      await db.runAsync(
        `INSERT INTO activity_log (id, category_id, habit_id, type, value, unit, metadata, timestamp, logical_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        entry.categoryId,
        entry.habitId ?? null,
        entry.type,
        entry.value,
        entry.unit ?? null,
        entry.metadata ?? null,
        entry.timestamp,
        entry.logicalDate,
        createdAt,
      );

      return {
        id,
        ...entry,
        createdAt,
      } as ActivityLog;
    },

    async getByDateRange(startDate, endDate) {
      const rows = await db.getAllAsync<ActivityLogRow>(
        `SELECT * FROM activity_log
         WHERE logical_date >= ? AND logical_date <= ?
         ORDER BY timestamp ASC`,
        startDate,
        endDate,
      );
      return rows.map(mapRow);
    },

    async getByCategoryAndDateRange(categoryId, startDate, endDate) {
      const rows = await db.getAllAsync<ActivityLogRow>(
        `SELECT * FROM activity_log
         WHERE category_id = ? AND logical_date >= ? AND logical_date <= ?
         ORDER BY timestamp ASC`,
        categoryId,
        startDate,
        endDate,
      );
      return rows.map(mapRow);
    },

    async getByHabitAndDateRange(habitId, startDate, endDate) {
      const rows = await db.getAllAsync<ActivityLogRow>(
        `SELECT * FROM activity_log
         WHERE habit_id = ? AND logical_date >= ? AND logical_date <= ?
         ORDER BY timestamp ASC`,
        habitId,
        startDate,
        endDate,
      );
      return rows.map(mapRow);
    },

    async getDayActivitiesForHabit(habitId, startDate, endDate) {
      // Aggregate activities by logical_date for a specific habit
      const rows = await db.getAllAsync<{
        logical_date: string;
        total_value: number;
      }>(
        `SELECT logical_date, SUM(value) as total_value
         FROM activity_log
         WHERE habit_id = ? AND logical_date >= ? AND logical_date <= ?
         GROUP BY logical_date
         ORDER BY logical_date ASC`,
        habitId,
        startDate,
        endDate,
      );

      // Also get rest tokens for this habit in the range
      const restTokens = await db.getAllAsync<{ logical_date: string }>(
        `SELECT logical_date FROM rest_token
         WHERE habit_id = ? AND logical_date >= ? AND logical_date <= ?`,
        habitId,
        startDate,
        endDate,
      );

      const restTokenDates = new Set(restTokens.map((r) => r.logical_date));
      const activityByDate = new Map(
        rows.map((r) => [r.logical_date, r.total_value]),
      );

      // We need the habit's requirement to determine fulfillment
      const habit = await db.getFirstAsync<{
        requirement_type: string;
        requirement_value: number;
      }>(
        'SELECT requirement_type, requirement_value FROM habit WHERE id = ?',
        habitId,
      );

      const reqType = (habit?.requirement_type ?? 'any') as 'any' | 'count';
      const reqValue = habit?.requirement_value ?? 1;

      // Build DayActivity array — include all dates in range
      const result: DayActivity[] = [];
      const allDates = new Set([
        ...activityByDate.keys(),
        ...restTokenDates,
      ]);

      for (const date of Array.from(allDates).sort()) {
        const value = activityByDate.get(date) ?? 0;
        const restTokenUsed = restTokenDates.has(date);
        const fulfilled = reqType === 'any' ? value > 0 : value >= reqValue;

        result.push({
          date,
          fulfilled,
          value,
          restTokenUsed,
        });
      }

      return result;
    },

    async getByDate(logicalDate) {
      const rows = await db.getAllAsync<ActivityLogRow>(
        `SELECT * FROM activity_log WHERE logical_date = ? ORDER BY timestamp ASC`,
        logicalDate,
      );
      return rows.map(mapRow);
    },

    async delete(id) {
      await db.runAsync('DELETE FROM activity_log WHERE id = ?', id);
    },

    async getAll() {
      const rows = await db.getAllAsync<ActivityLogRow>(
        `SELECT * FROM activity_log ORDER BY timestamp ASC`,
      );
      return rows.map(mapRow);
    },
  };
}

// ─── Internal types & mappers ───────────────────────────────────

interface ActivityLogRow {
  id: string;
  category_id: string;
  habit_id: string | null;
  type: string;
  value: number;
  unit: string | null;
  metadata: string | null;
  timestamp: string;
  logical_date: string;
  created_at: string;
}

function mapRow(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    categoryId: row.category_id,
    habitId: row.habit_id,
    type: row.type as ActivityLog['type'],
    value: row.value,
    unit: row.unit,
    metadata: row.metadata,
    timestamp: row.timestamp,
    logicalDate: row.logical_date,
    createdAt: row.created_at,
  };
}
