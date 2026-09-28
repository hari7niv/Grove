/**
 * Category & Habit repository implementations.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category, Habit } from '../../types/models';
import type { CategoryRepository, HabitRepository } from './types';
import { generateId, nowISO } from '../../utils/date';

// ─── Category Repository ────────────────────────────────────────

export function createCategoryRepository(db: SQLiteDatabase): CategoryRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<CategoryRow>(
        'SELECT * FROM category ORDER BY sort_order ASC',
      );
      return rows.map(mapCategoryRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<CategoryRow>(
        'SELECT * FROM category WHERE id = ?',
        id,
      );
      return row ? mapCategoryRow(row) : null;
    },

    async create(category) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO category (id, name, color, icon, plant_type, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        category.name,
        category.color,
        category.icon,
        category.plantType,
        category.sortOrder,
        now,
        now,
      );

      return {
        id,
        ...category,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(id, updates) {
      const existing = await this.getById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: nowISO() };

      await db.runAsync(
        `UPDATE category SET name = ?, color = ?, icon = ?, plant_type = ?,
         sort_order = ?, updated_at = ? WHERE id = ?`,
        updated.name,
        updated.color,
        updated.icon,
        updated.plantType,
        updated.sortOrder,
        updated.updatedAt,
        id,
      );

      return updated;
    },

    async delete(id) {
      await db.runAsync('DELETE FROM category WHERE id = ?', id);
    },
  };
}

// ─── Habit Repository ───────────────────────────────────────────

export function createHabitRepository(db: SQLiteDatabase): HabitRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<HabitRow>('SELECT * FROM habit');
      return rows.map(mapHabitRow);
    },

    async getActive() {
      const rows = await db.getAllAsync<HabitRow>(
        'SELECT * FROM habit WHERE active = 1',
      );
      return rows.map(mapHabitRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<HabitRow>(
        'SELECT * FROM habit WHERE id = ?',
        id,
      );
      return row ? mapHabitRow(row) : null;
    },

    async getByCategoryId(categoryId) {
      const rows = await db.getAllAsync<HabitRow>(
        'SELECT * FROM habit WHERE category_id = ?',
        categoryId,
      );
      return rows.map(mapHabitRow);
    },

    async create(habit) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO habit (id, category_id, name, requirement_type, requirement_value, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        habit.categoryId,
        habit.name,
        habit.requirementType,
        habit.requirementValue,
        habit.active ? 1 : 0,
        now,
        now,
      );

      return {
        id,
        ...habit,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(id, updates) {
      const existing = await this.getById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: nowISO() };

      await db.runAsync(
        `UPDATE habit SET category_id = ?, name = ?, requirement_type = ?,
         requirement_value = ?, active = ?, updated_at = ? WHERE id = ?`,
        updated.categoryId,
        updated.name,
        updated.requirementType,
        updated.requirementValue,
        updated.active ? 1 : 0,
        updated.updatedAt,
        id,
      );

      return updated;
    },

    async delete(id) {
      await db.runAsync('DELETE FROM habit WHERE id = ?', id);
    },
  };
}

// ─── Internal types & mappers ───────────────────────────────────

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  icon: string;
  plant_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    plantType: row.plant_type,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface HabitRow {
  id: string;
  category_id: string;
  name: string;
  requirement_type: string;
  requirement_value: number;
  active: number;
  created_at: string;
  updated_at: string;
}

function mapHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    requirementType: row.requirement_type as Habit['requirementType'],
    requirementValue: row.requirement_value,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
