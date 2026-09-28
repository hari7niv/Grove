/**
 * Books repository implementation.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Book, BookQuote, BookStatus } from '../../types/models';
import type { BookRepository } from './types';
import { generateId, nowISO } from '../../utils/date';

export function createBookRepository(db: SQLiteDatabase): BookRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<BookRow>('SELECT * FROM book ORDER BY updated_at DESC');
      return rows.map(mapBookRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<BookRow>('SELECT * FROM book WHERE id = ?', id);
      return row ? mapBookRow(row) : null;
    },

    async create(book) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO book (
          id, title, author, status, total_pages, current_page, rating, start_date, finish_date, notes, cover_color, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        book.title,
        book.author ?? null,
        book.status,
        book.totalPages ?? null,
        book.currentPage,
        book.rating ?? null,
        book.startDate ?? null,
        book.finishDate ?? null,
        book.notes ?? null,
        book.coverColor ?? null,
        now,
        now,
      );

      return {
        id,
        ...book,
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
        `UPDATE book SET 
          title = ?, author = ?, status = ?, total_pages = ?, current_page = ?, rating = ?, start_date = ?, finish_date = ?, notes = ?, cover_color = ?, updated_at = ?
         WHERE id = ?`,
        merged.title,
        merged.author ?? null,
        merged.status,
        merged.totalPages ?? null,
        merged.currentPage,
        merged.rating ?? null,
        merged.startDate ?? null,
        merged.finishDate ?? null,
        merged.notes ?? null,
        merged.coverColor ?? null,
        now,
        id,
      );

      return merged;
    },

    async delete(id) {
      await db.runAsync('DELETE FROM book WHERE id = ?', id);
      await db.runAsync('DELETE FROM book_quote WHERE book_id = ?', id);
    },

    async getQuotes(bookId) {
      const rows = await db.getAllAsync<QuoteRow>('SELECT * FROM book_quote WHERE book_id = ? ORDER BY created_at ASC', bookId);
      return rows.map(mapQuoteRow);
    },

    async addQuote(quote) {
      const id = generateId();
      const now = nowISO();

      await db.runAsync(
        `INSERT INTO book_quote (id, book_id, text, page, created_at) VALUES (?, ?, ?, ?, ?)`,
        id,
        quote.bookId,
        quote.text,
        quote.page ?? null,
        now
      );

      return { id, ...quote, createdAt: now };
    },

    async deleteQuote(id) {
      await db.runAsync('DELETE FROM book_quote WHERE id = ?', id);
    },
  };
}

interface BookRow {
  id: string;
  title: string;
  author: string | null;
  status: string;
  total_pages: number | null;
  current_page: number;
  rating: number | null;
  start_date: string | null;
  finish_date: string | null;
  notes: string | null;
  cover_color: string | null;
  created_at: string;
  updated_at: string;
}

function mapBookRow(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    status: row.status as BookStatus,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    rating: row.rating,
    startDate: row.start_date,
    finishDate: row.finish_date,
    notes: row.notes,
    coverColor: row.cover_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface QuoteRow {
  id: string;
  book_id: string;
  text: string;
  page: number | null;
  created_at: string;
}

function mapQuoteRow(row: QuoteRow): BookQuote {
  return {
    id: row.id,
    bookId: row.book_id,
    text: row.text,
    page: row.page,
    createdAt: row.created_at,
  };
}
