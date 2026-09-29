/**
 * Database schema definitions and initial migration.
 *
 * All table creation SQL lives here. The migration system applies
 * these in order based on version numbers.
 */

export interface Migration {
  version: number;
  name: string;
  sql: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: [
      // Categories
      `CREATE TABLE IF NOT EXISTS category (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        plant_type TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Habits
      `CREATE TABLE IF NOT EXISTS habit (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES category(id),
        name TEXT NOT NULL,
        requirement_type TEXT NOT NULL DEFAULT 'any',
        requirement_value INTEGER NOT NULL DEFAULT 1,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Activity Log
      `CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES category(id),
        habit_id TEXT REFERENCES habit(id),
        type TEXT NOT NULL,
        value REAL NOT NULL DEFAULT 1,
        unit TEXT,
        metadata TEXT,
        timestamp TEXT NOT NULL,
        logical_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(logical_date)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_log_category ON activity_log(category_id, logical_date)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_log_habit ON activity_log(habit_id, logical_date)`,

      // Rest Tokens
      `CREATE TABLE IF NOT EXISTS rest_token (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL REFERENCES habit(id),
        logical_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,

      // Exercises
      `CREATE TABLE IF NOT EXISTS exercise (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mode TEXT NOT NULL,
        category_id TEXT REFERENCES category(id),
        target_duration INTEGER,
        target_reps INTEGER,
        target_sets INTEGER,
        rest_duration INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Routines
      `CREATE TABLE IF NOT EXISTS routine (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        exercise_ids TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Exercise Sessions
      `CREATE TABLE IF NOT EXISTS exercise_session (
        id TEXT PRIMARY KEY,
        exercise_id TEXT NOT NULL REFERENCES exercise(id),
        routine_id TEXT REFERENCES routine(id),
        started_at TEXT NOT NULL,
        finished_at TEXT,
        duration INTEGER,
        sets_completed INTEGER,
        reps_completed INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL
      )`,

      // Books
      `CREATE TABLE IF NOT EXISTS book (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        status TEXT NOT NULL DEFAULT 'want_to_read',
        total_pages INTEGER,
        current_page INTEGER DEFAULT 0,
        rating INTEGER,
        start_date TEXT,
        finish_date TEXT,
        notes TEXT,
        cover_color TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Book Quotes
      `CREATE TABLE IF NOT EXISTS book_quote (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL REFERENCES book(id),
        text TEXT NOT NULL,
        page INTEGER,
        created_at TEXT NOT NULL
      )`,

      // Tasks
      `CREATE TABLE IF NOT EXISTS task (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT,
        due_time TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'pending',
        category_id TEXT REFERENCES category(id),
        parent_id TEXT REFERENCES task(id),
        tags TEXT,
        recurrence_rule TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Reminders
      `CREATE TABLE IF NOT EXISTS reminder (
        id TEXT PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_id TEXT,
        title TEXT NOT NULL,
        time TEXT NOT NULL,
        recurrence_rule TEXT,
        notification_id TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Roadmaps
      `CREATE TABLE IF NOT EXISTS roadmap (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT REFERENCES category(id),
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Roadmap Items
      `CREATE TABLE IF NOT EXISTS roadmap_item (
        id TEXT PRIMARY KEY,
        roadmap_id TEXT NOT NULL REFERENCES roadmap(id),
        parent_id TEXT REFERENCES roadmap_item(id),
        title TEXT NOT NULL,
        notes TEXT,
        resource_links TEXT,
        time_estimate INTEGER,
        completed INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Focus Sessions
      `CREATE TABLE IF NOT EXISTS focus_session (
        id TEXT PRIMARY KEY,
        category_id TEXT REFERENCES category(id),
        task_id TEXT REFERENCES task(id),
        mode TEXT NOT NULL,
        target_duration INTEGER,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        actual_duration INTEGER,
        quality_rating INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL
      )`,

      // Feed Sources
      `CREATE TABLE IF NOT EXISTS feed_source (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        site_url TEXT,
        last_fetched TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Articles
      `CREATE TABLE IF NOT EXISTS article (
        id TEXT PRIMARY KEY,
        feed_id TEXT NOT NULL REFERENCES feed_source(id),
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        author TEXT,
        published_at TEXT,
        content TEXT,
        summary TEXT,
        is_read INTEGER NOT NULL DEFAULT 0,
        is_saved INTEGER NOT NULL DEFAULT 0,
        read_minutes INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )`,

      // Settings
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,

      // Seed default settings
      `INSERT OR IGNORE INTO settings (key, value) VALUES
        ('dayStartHour', '4'),
        ('restTokensPerMonth', '2'),
        ('themePreference', 'system'),
        ('notificationsEnabled', 'true'),
        ('reduceMotion', 'false'),
        ('units', 'metric')`,
    ],
  },
  {
    version: 2,
    name: 'performance_indexes',
    sql: [
      `CREATE INDEX IF NOT EXISTS idx_task_due_date ON task(due_date)`,
      `CREATE INDEX IF NOT EXISTS idx_task_status ON task(status)`,
      `CREATE INDEX IF NOT EXISTS idx_task_category ON task(category_id)`,
      
      `CREATE INDEX IF NOT EXISTS idx_exercise_session_exercise ON exercise_session(exercise_id)`,
      `CREATE INDEX IF NOT EXISTS idx_exercise_session_started ON exercise_session(started_at)`,
      
      `CREATE INDEX IF NOT EXISTS idx_focus_session_category ON focus_session(category_id)`,
      `CREATE INDEX IF NOT EXISTS idx_focus_session_started ON focus_session(started_at)`,
      
      `CREATE INDEX IF NOT EXISTS idx_book_status ON book(status)`,
      
      `CREATE INDEX IF NOT EXISTS idx_roadmap_item_roadmap ON roadmap_item(roadmap_id)`,
      
      `CREATE INDEX IF NOT EXISTS idx_article_feed ON article(feed_id)`,
      `CREATE INDEX IF NOT EXISTS idx_article_read_saved ON article(is_read, is_saved)`,
      `CREATE INDEX IF NOT EXISTS idx_article_published ON article(published_at)`,
      
      `CREATE INDEX IF NOT EXISTS idx_habit_category ON habit(category_id)`,
      `CREATE INDEX IF NOT EXISTS idx_rest_token_habit ON rest_token(habit_id, logical_date)`,
    ],
  }
];

/** Get the latest migration version */
export function getLatestVersion(): number {
  return MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;
}
