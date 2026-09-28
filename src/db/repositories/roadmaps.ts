/**
 * Roadmaps repository implementation.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Roadmap, RoadmapItem } from '../../types/models';
import type { RoadmapRepository } from './types';
import { generateId, nowISO } from '../../utils/date';

export function createRoadmapRepository(db: SQLiteDatabase): RoadmapRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<RoadmapRow>('SELECT * FROM roadmap ORDER BY updated_at DESC');
      return rows.map(mapRoadmapRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<RoadmapRow>('SELECT * FROM roadmap WHERE id = ?', id);
      return row ? mapRoadmapRow(row) : null;
    },

    async create(roadmap) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO roadmap (id, name, category_id, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        roadmap.name,
        roadmap.categoryId ?? null,
        roadmap.description ?? null,
        now,
        now
      );

      return {
        id,
        ...roadmap,
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
        `UPDATE roadmap SET name = ?, category_id = ?, description = ?, updated_at = ? WHERE id = ?`,
        merged.name,
        merged.categoryId ?? null,
        merged.description ?? null,
        now,
        id
      );

      return merged;
    },

    async delete(id) {
      await db.runAsync('DELETE FROM roadmap WHERE id = ?', id);
      await db.runAsync('DELETE FROM roadmap_item WHERE roadmap_id = ?', id);
    },

    async getItems(roadmapId) {
      const rows = await db.getAllAsync<RoadmapItemRow>(
        'SELECT * FROM roadmap_item WHERE roadmap_id = ? ORDER BY sort_order ASC', 
        roadmapId
      );
      return rows.map(mapRoadmapItemRow);
    },

    async createItem(item) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO roadmap_item (
          id, roadmap_id, parent_id, title, notes, resource_links, time_estimate, completed, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        item.roadmapId,
        item.parentId ?? null,
        item.title,
        item.notes ?? null,
        item.resourceLinks.length > 0 ? JSON.stringify(item.resourceLinks) : null,
        item.timeEstimate ?? null,
        item.completed ? 1 : 0,
        item.sortOrder,
        now,
        now
      );

      return { id, ...item, createdAt: now, updatedAt: now };
    },

    async updateItem(id, updates) {
      const now = nowISO();
      // Need a helper to get item by id, but for update we can just use the provided updates assuming they are full or we can fetch first.
      const row = await db.getFirstAsync<RoadmapItemRow>('SELECT * FROM roadmap_item WHERE id = ?', id);
      if (!row) return null;
      
      const current = mapRoadmapItemRow(row);
      const merged = { ...current, ...updates, updatedAt: now };

      await db.runAsync(
        `UPDATE roadmap_item SET 
          parent_id = ?, title = ?, notes = ?, resource_links = ?, time_estimate = ?, completed = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`,
        merged.parentId ?? null,
        merged.title,
        merged.notes ?? null,
        merged.resourceLinks.length > 0 ? JSON.stringify(merged.resourceLinks) : null,
        merged.timeEstimate ?? null,
        merged.completed ? 1 : 0,
        merged.sortOrder,
        now,
        id
      );

      return merged;
    },

    async deleteItem(id) {
      await db.runAsync('DELETE FROM roadmap_item WHERE id = ?', id);
      // Delete children
      await db.runAsync('DELETE FROM roadmap_item WHERE parent_id = ?', id);
    },
  };
}

interface RoadmapRow {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function mapRoadmapRow(row: RoadmapRow): Roadmap {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface RoadmapItemRow {
  id: string;
  roadmap_id: string;
  parent_id: string | null;
  title: string;
  notes: string | null;
  resource_links: string | null;
  time_estimate: number | null;
  completed: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapRoadmapItemRow(row: RoadmapItemRow): RoadmapItem {
  return {
    id: row.id,
    roadmapId: row.roadmap_id,
    parentId: row.parent_id,
    title: row.title,
    notes: row.notes,
    resourceLinks: row.resource_links ? JSON.parse(row.resource_links) : [],
    timeEstimate: row.time_estimate,
    completed: row.completed === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
