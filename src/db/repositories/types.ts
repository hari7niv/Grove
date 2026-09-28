/**
 * Repository interfaces — data access abstraction.
 * All database operations go through these interfaces.
 */

import type {
  ActivityLog,
  Category,
  Habit,
  RestToken,
  AppSettings,
  DayActivity,
  Exercise,
  Routine,
  ExerciseSession,
  Task,
  Reminder,
  FocusSession,
  Book,
  BookQuote,
  Roadmap,
  RoadmapItem,
  FeedSource,
  Article,
} from '../../types/models';

export interface ActivityLogRepository {
  create(entry: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;
  getByDateRange(startDate: string, endDate: string): Promise<ActivityLog[]>;
  getByCategoryAndDateRange(
    categoryId: string,
    startDate: string,
    endDate: string,
  ): Promise<ActivityLog[]>;
  getByHabitAndDateRange(
    habitId: string,
    startDate: string,
    endDate: string,
  ): Promise<ActivityLog[]>;
  getDayActivitiesForHabit(
    habitId: string,
    startDate: string,
    endDate: string,
  ): Promise<DayActivity[]>;
  getByDate(logicalDate: string): Promise<ActivityLog[]>;
  delete(id: string): Promise<void>;
  getAll(): Promise<ActivityLog[]>; // Added for full sync capability
}

export interface CategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
  update(id: string, updates: Partial<Category>): Promise<Category | null>;
  delete(id: string): Promise<void>;
}

export interface HabitRepository {
  getAll(): Promise<Habit[]>;
  getActive(): Promise<Habit[]>;
  getById(id: string): Promise<Habit | null>;
  getByCategoryId(categoryId: string): Promise<Habit[]>;
  create(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit>;
  update(id: string, updates: Partial<Habit>): Promise<Habit | null>;
  delete(id: string): Promise<void>;
}

export interface RestTokenRepository {
  create(token: Omit<RestToken, 'id' | 'createdAt'>): Promise<RestToken>;
  getByHabitAndMonth(habitId: string, monthKey: string): Promise<RestToken[]>;
  getByHabitAndDate(habitId: string, logicalDate: string): Promise<RestToken | null>;
  delete(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  getAll(): Promise<AppSettings>;
}

export interface ExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | null>;
  create(exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exercise>;
  update(id: string, updates: Partial<Exercise>): Promise<Exercise | null>;
  delete(id: string): Promise<void>;
}

export interface RoutineRepository {
  getAll(): Promise<Routine[]>;
  getById(id: string): Promise<Routine | null>;
  create(routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Routine>;
  update(id: string, updates: Partial<Routine>): Promise<Routine | null>;
  delete(id: string): Promise<void>;
}

export interface ExerciseSessionRepository {
  getByExerciseId(exerciseId: string): Promise<ExerciseSession[]>;
  getByRoutineId(routineId: string): Promise<ExerciseSession[]>;
  create(session: Omit<ExerciseSession, 'id' | 'createdAt'>): Promise<ExerciseSession>;
  update(id: string, updates: Partial<ExerciseSession>): Promise<ExerciseSession | null>;
}

export interface TaskRepository {
  getAll(): Promise<Task[]>;
  getPending(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  update(id: string, updates: Partial<Task>): Promise<Task | null>;
  delete(id: string): Promise<void>;
}

export interface ReminderRepository {
  getAll(): Promise<Reminder[]>;
  getActive(): Promise<Reminder[]>;
  getByTargetId(targetId: string): Promise<Reminder[]>;
  getById(id: string): Promise<Reminder | null>;
  create(reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder>;
  update(id: string, updates: Partial<Reminder>): Promise<Reminder | null>;
  delete(id: string): Promise<void>;
}

export interface FocusSessionRepository {
  getAll(): Promise<FocusSession[]>;
  getById(id: string): Promise<FocusSession | null>;
  create(session: Omit<FocusSession, 'id' | 'createdAt'>): Promise<FocusSession>;
  update(id: string, updates: Partial<FocusSession>): Promise<FocusSession | null>;
  delete(id: string): Promise<void>;
}

export interface BookRepository {
  getAll(): Promise<Book[]>;
  getById(id: string): Promise<Book | null>;
  create(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<Book>;
  update(id: string, updates: Partial<Book>): Promise<Book | null>;
  delete(id: string): Promise<void>;
  
  getQuotes(bookId: string): Promise<BookQuote[]>;
  addQuote(quote: Omit<BookQuote, 'id' | 'createdAt'>): Promise<BookQuote>;
  deleteQuote(id: string): Promise<void>;
}

export interface RoadmapRepository {
  getAll(): Promise<Roadmap[]>;
  getById(id: string): Promise<Roadmap | null>;
  create(roadmap: Omit<Roadmap, 'id' | 'createdAt' | 'updatedAt'>): Promise<Roadmap>;
  update(id: string, updates: Partial<Roadmap>): Promise<Roadmap | null>;
  delete(id: string): Promise<void>;
  
  getItems(roadmapId: string): Promise<RoadmapItem[]>;
  createItem(item: Omit<RoadmapItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoadmapItem>;
  updateItem(id: string, updates: Partial<RoadmapItem>): Promise<RoadmapItem | null>;
  deleteItem(id: string): Promise<void>;
}

export interface FeedSourceRepository {
  getAll(): Promise<FeedSource[]>;
  getById(id: string): Promise<FeedSource | null>;
  getByUrl(url: string): Promise<FeedSource | null>;
  create(feed: Omit<FeedSource, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeedSource>;
  update(id: string, updates: Partial<FeedSource>): Promise<FeedSource | null>;
  delete(id: string): Promise<void>;
}

export interface ArticleRepository {
  getAll(): Promise<Article[]>;
  getByFeedId(feedId: string): Promise<Article[]>;
  getUnread(): Promise<Article[]>;
  getSaved(): Promise<Article[]>;
  getById(id: string): Promise<Article | null>;
  getByGuid(guid: string): Promise<Article | null>;
  create(article: Omit<Article, 'id' | 'createdAt'>): Promise<Article>;
  markRead(id: string): Promise<void>;
  markUnread(id: string): Promise<void>;
  toggleSaved(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Article[]>;
  getUnreadCount(): Promise<number>;
}
