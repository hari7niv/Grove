/**
 * Core model types for Grove.
 *
 * These mirror the database schema but as TypeScript interfaces.
 * Used throughout the app for type safety.
 */

// ─── Enums ──────────────────────────────────────────────────────

export type PlantStage = 'seed' | 'sprout' | 'sapling' | 'young_tree' | 'mature_tree' | 'grove';
export type HealthState = 'thriving' | 'ok' | 'wilting' | 'dying';
export type ExerciseMode = 'timer' | 'count';
export type BookStatus = 'want_to_read' | 'reading' | 'finished';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'done' | 'cancelled';
export type FocusMode = 'countdown' | 'stopwatch';
export type ActivityType = 'exercise' | 'reading' | 'task' | 'focus' | 'roadmap' | 'article' | 'custom';
export type HabitRequirementType = 'any' | 'count';
export type ReminderTargetType = 'task' | 'habit' | 'exercise' | 'custom';
export type ThemePreference = 'system' | 'light' | 'dark';

// ─── Core Entities ──────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  plantType: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  categoryId: string;
  name: string;
  requirementType: HabitRequirementType;
  requirementValue: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  categoryId: string;
  habitId: string | null;
  type: ActivityType;
  value: number;
  unit: string | null;
  metadata: string | null;
  timestamp: string;
  logicalDate: string;
  createdAt: string;
}

export interface RestToken {
  id: string;
  habitId: string;
  logicalDate: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  mode: ExerciseMode;
  categoryId: string | null;
  targetDuration: number | null;
  targetReps: number | null;
  targetSets: number | null;
  restDuration: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseSession {
  id: string;
  exerciseId: string;
  routineId: string | null;
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
  setsCompleted: number | null;
  repsCompleted: number | null;
  notes: string | null;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  status: BookStatus;
  totalPages: number | null;
  currentPage: number;
  rating: number | null;
  startDate: string | null;
  finishDate: string | null;
  notes: string | null;
  coverColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookQuote {
  id: string;
  bookId: string;
  text: string;
  page: number | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  dueTime: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  categoryId: string | null;
  parentId: string | null;
  tags: string[];
  recurrenceRule: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  targetType: ReminderTargetType;
  targetId: string | null;
  title: string;
  time: string;
  recurrenceRule: string | null;
  notificationId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Roadmap {
  id: string;
  name: string;
  categoryId: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapItem {
  id: string;
  roadmapId: string;
  parentId: string | null;
  title: string;
  notes: string | null;
  resourceLinks: string[];
  timeEstimate: number | null;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  categoryId: string | null;
  taskId: string | null;
  mode: FocusMode;
  targetDuration: number | null;
  startedAt: string;
  finishedAt: string | null;
  actualDuration: number | null;
  qualityRating: number | null;
  notes: string | null;
  createdAt: string;
}

export interface FeedSource {
  id: string;
  title: string;
  url: string;
  siteUrl: string | null;
  lastFetched: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  feedId: string;
  title: string;
  url: string;
  author: string | null;
  publishedAt: string | null;
  content: string | null;
  summary: string | null;
  isRead: boolean;
  isSaved: boolean;
  readMinutes: number;
  createdAt: string;
}

// ─── Computed / Derived Types ───────────────────────────────────

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  healthState: HealthState;
  plantStage: PlantStage;
  isRecovering: boolean;
  recoveryDaysRemaining: number;
  restTokensUsedThisMonth: number;
}

export interface DayActivity {
  date: string;
  fulfilled: boolean;
  value: number;
  restTokenUsed: boolean;
}

// ─── Settings ───────────────────────────────────────────────────

export interface AppSettings {
  dayStartHour: number;
  restTokensPerMonth: number;
  themePreference: ThemePreference;
  notificationsEnabled: boolean;
  reduceMotion: boolean;
  units: 'metric' | 'imperial';
  targetRole: 'swe' | 'ml_infra';
  rssProxyUrl: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  dayStartHour: 4,
  restTokensPerMonth: 2,
  themePreference: 'system',
  notificationsEnabled: true,
  reduceMotion: false,
  units: 'metric',
  targetRole: 'swe',
  rssProxyUrl: 'https://api.allorigins.win/raw?url=',
};
