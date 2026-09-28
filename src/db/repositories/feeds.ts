/**
 * Feed and Article repository implementation.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { FeedSource, Article } from '../../types/models';
import type { FeedSourceRepository, ArticleRepository } from './types';
import { generateId, nowISO } from '../../utils/date';

// ─── Feed Source Repository ────────────────────────────────────

export function createFeedSourceRepository(db: SQLiteDatabase): FeedSourceRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<FeedSourceRow>(
        'SELECT * FROM feed_source ORDER BY title ASC'
      );
      return rows.map(mapFeedSourceRow);
    },

    async getById(id: string) {
      const row = await db.getFirstAsync<FeedSourceRow>(
        'SELECT * FROM feed_source WHERE id = ?',
        id
      );
      return row ? mapFeedSourceRow(row) : null;
    },

    async getByUrl(url: string) {
      const row = await db.getFirstAsync<FeedSourceRow>(
        'SELECT * FROM feed_source WHERE url = ?',
        url
      );
      return row ? mapFeedSourceRow(row) : null;
    },

    async create(feed) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO feed_source (id, title, url, site_url, last_fetched, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        feed.title,
        feed.url,
        feed.siteUrl ?? null,
        feed.lastFetched ?? null,
        now,
        now
      );

      return {
        id,
        ...feed,
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
        `UPDATE feed_source SET
          title = ?, url = ?, site_url = ?, last_fetched = ?, updated_at = ?
         WHERE id = ?`,
        merged.title,
        merged.url,
        merged.siteUrl ?? null,
        merged.lastFetched ?? null,
        now,
        id
      );

      return merged;
    },

    async delete(id) {
      // Delete all articles for this feed first
      await db.runAsync('DELETE FROM article WHERE feed_id = ?', id);
      await db.runAsync('DELETE FROM feed_source WHERE id = ?', id);
    },
  };
}

// ─── Article Repository ────────────────────────────────────────

export function createArticleRepository(db: SQLiteDatabase): ArticleRepository {
  return {
    async getByFeedId(feedId: string) {
      const rows = await db.getAllAsync<ArticleRow>(
        'SELECT * FROM article WHERE feed_id = ? ORDER BY published_at DESC, created_at DESC',
        feedId
      );
      return rows.map(mapArticleRow);
    },

    async getAll() {
      const rows = await db.getAllAsync<ArticleRow>(
        'SELECT * FROM article ORDER BY published_at DESC, created_at DESC LIMIT 200'
      );
      return rows.map(mapArticleRow);
    },

    async getUnread() {
      const rows = await db.getAllAsync<ArticleRow>(
        'SELECT * FROM article WHERE is_read = 0 ORDER BY published_at DESC, created_at DESC LIMIT 200'
      );
      return rows.map(mapArticleRow);
    },

    async getSaved() {
      const rows = await db.getAllAsync<ArticleRow>(
        'SELECT * FROM article WHERE is_saved = 1 ORDER BY published_at DESC, created_at DESC'
      );
      return rows.map(mapArticleRow);
    },

    async getById(id: string) {
      const row = await db.getFirstAsync<ArticleRow>(
        'SELECT * FROM article WHERE id = ?',
        id
      );
      return row ? mapArticleRow(row) : null;
    },

    async getByGuid(guid: string) {
      // Use URL as guid proxy since we store url as well
      const row = await db.getFirstAsync<ArticleRow>(
        'SELECT * FROM article WHERE url = ?',
        guid
      );
      return row ? mapArticleRow(row) : null;
    },

    async create(article) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO article (
          id, feed_id, title, url, author, published_at,
          content, summary, is_read, is_saved, read_minutes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        article.feedId,
        article.title,
        article.url,
        article.author ?? null,
        article.publishedAt ?? null,
        article.content ?? null,
        article.summary ?? null,
        article.isRead ? 1 : 0,
        article.isSaved ? 1 : 0,
        article.readMinutes ?? 0,
        now
      );

      return {
        id,
        ...article,
        createdAt: now,
      };
    },

    async markRead(id: string) {
      await db.runAsync(
        'UPDATE article SET is_read = 1 WHERE id = ?',
        id
      );
    },

    async markUnread(id: string) {
      await db.runAsync(
        'UPDATE article SET is_read = 0 WHERE id = ?',
        id
      );
    },

    async toggleSaved(id: string) {
      await db.runAsync(
        'UPDATE article SET is_saved = CASE WHEN is_saved = 1 THEN 0 ELSE 1 END WHERE id = ?',
        id
      );
    },

    async delete(id: string) {
      await db.runAsync('DELETE FROM article WHERE id = ?', id);
    },

    async search(query: string) {
      const pattern = `%${query}%`;
      const rows = await db.getAllAsync<ArticleRow>(
        `SELECT * FROM article
         WHERE title LIKE ? OR summary LIKE ? OR content LIKE ?
         ORDER BY published_at DESC LIMIT 50`,
        pattern,
        pattern,
        pattern
      );
      return rows.map(mapArticleRow);
    },

    async getUnreadCount() {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM article WHERE is_read = 0'
      );
      return result?.count ?? 0;
    },
  };
}

// ─── Internal types & mappers ──────────────────────────────────

interface FeedSourceRow {
  id: string;
  title: string;
  url: string;
  site_url: string | null;
  last_fetched: string | null;
  created_at: string;
  updated_at: string;
}

function mapFeedSourceRow(row: FeedSourceRow): FeedSource {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    siteUrl: row.site_url,
    lastFetched: row.last_fetched,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ArticleRow {
  id: string;
  feed_id: string;
  title: string;
  url: string;
  author: string | null;
  published_at: string | null;
  content: string | null;
  summary: string | null;
  is_read: number;
  is_saved: number;
  read_minutes: number;
  created_at: string;
}

function mapArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    feedId: row.feed_id,
    title: row.title,
    url: row.url,
    author: row.author,
    publishedAt: row.published_at,
    content: row.content,
    summary: row.summary,
    isRead: row.is_read === 1,
    isSaved: row.is_saved === 1,
    readMinutes: row.read_minutes,
    createdAt: row.created_at,
  };
}
