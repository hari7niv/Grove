/**
 * Tasks and Reminders repository implementation.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Task, Reminder, TaskPriority, TaskStatus, ReminderTargetType } from '../../types/models';
import type { TaskRepository, ReminderRepository } from './types';
import { generateId, nowISO } from '../../utils/date';

export function createTaskRepository(db: SQLiteDatabase): TaskRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<TaskRow>('SELECT * FROM task ORDER BY created_at DESC');
      return rows.map(mapTaskRow);
    },

    async getPending() {
      const rows = await db.getAllAsync<TaskRow>(
        'SELECT * FROM task WHERE status = ? ORDER BY due_date ASC, priority DESC',
        'pending'
      );
      return rows.map(mapTaskRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<TaskRow>('SELECT * FROM task WHERE id = ?', id);
      return row ? mapTaskRow(row) : null;
    },

    async create(task) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO task (
          id, title, description, due_date, due_time, priority, status, 
          category_id, parent_id, tags, recurrence_rule, completed_at, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        task.title,
        task.description ?? null,
        task.dueDate ?? null,
        task.dueTime ?? null,
        task.priority,
        task.status,
        task.categoryId ?? null,
        task.parentId ?? null,
        (task.tags?.length || 0) > 0 ? JSON.stringify(task.tags) : null,
        task.recurrenceRule ?? null,
        task.completedAt ?? null,
        now,
        now,
      );

      return {
        id,
        ...task,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(id, updates) {
      const now = nowISO();
      const current = await this.getById(id);
      if (!current) return null;

      const merged = { ...current, ...updates, updatedAt: now };

      await db.runAsync(
        `UPDATE task SET 
          title = ?, description = ?, due_date = ?, due_time = ?, 
          priority = ?, status = ?, category_id = ?, parent_id = ?, 
          tags = ?, recurrence_rule = ?, completed_at = ?, updated_at = ?
         WHERE id = ?`,
        merged.title,
        merged.description ?? null,
        merged.dueDate ?? null,
        merged.dueTime ?? null,
        merged.priority,
        merged.status,
        merged.categoryId ?? null,
        merged.parentId ?? null,
        merged.tags.length > 0 ? JSON.stringify(merged.tags) : null,
        merged.recurrenceRule ?? null,
        merged.completedAt ?? null,
        now,
        id,
      );

      return merged;
    },

    async delete(id) {
      await db.runAsync('DELETE FROM task WHERE id = ?', id);
    },
  };
}

export function createReminderRepository(db: SQLiteDatabase): ReminderRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<ReminderRow>('SELECT * FROM reminder ORDER BY time ASC');
      return rows.map(mapReminderRow);
    },

    async getActive() {
      const rows = await db.getAllAsync<ReminderRow>('SELECT * FROM reminder WHERE active = 1 ORDER BY time ASC');
      return rows.map(mapReminderRow);
    },

    async getByTargetId(targetId: string) {
      const rows = await db.getAllAsync<ReminderRow>('SELECT * FROM reminder WHERE target_id = ? ORDER BY time ASC', targetId);
      return rows.map(mapReminderRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<ReminderRow>('SELECT * FROM reminder WHERE id = ?', id);
      return row ? mapReminderRow(row) : null;
    },

    async create(reminder) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO reminder (
          id, target_type, target_id, title, time, recurrence_rule, notification_id, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        reminder.targetType,
        reminder.targetId ?? null,
        reminder.title,
        reminder.time,
        reminder.recurrenceRule ?? null,
        reminder.notificationId ?? null,
        reminder.active ? 1 : 0,
        now,
        now,
      );

      return {
        id,
        ...reminder,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(id, updates) {
      const now = nowISO();
      const current = await this.getById(id);
      if (!current) return null;

      const merged = { ...current, ...updates, updatedAt: now };

      await db.runAsync(
        `UPDATE reminder SET 
          target_type = ?, target_id = ?, title = ?, time = ?, 
          recurrence_rule = ?, notification_id = ?, active = ?, updated_at = ?
         WHERE id = ?`,
        merged.targetType,
        merged.targetId ?? null,
        merged.title,
        merged.time,
        merged.recurrenceRule ?? null,
        merged.notificationId ?? null,
        merged.active ? 1 : 0,
        now,
        id,
      );

      return merged;
    },

    async delete(id) {
      await db.runAsync('DELETE FROM reminder WHERE id = ?', id);
    },
  };
}

// ─── Internal types & mappers ───────────────────────────────────

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  status: string;
  category_id: string | null;
  parent_id: string | null;
  tags: string | null;
  recurrence_rule: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    dueTime: row.due_time,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    categoryId: row.category_id,
    parentId: row.parent_id,
    tags: row.tags ? JSON.parse(row.tags) : [],
    recurrenceRule: row.recurrence_rule,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ReminderRow {
  id: string;
  target_type: string;
  target_id: string | null;
  title: string;
  time: string;
  recurrence_rule: string | null;
  notification_id: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

function mapReminderRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    targetType: row.target_type as ReminderTargetType,
    targetId: row.target_id,
    title: row.title,
    time: row.time,
    recurrenceRule: row.recurrence_rule,
    notificationId: row.notification_id,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
