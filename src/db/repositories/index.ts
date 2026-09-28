import type { SQLiteDatabase } from 'expo-sqlite';
import { createActivityLogRepository } from './activity-log';
import { createCategoryRepository, createHabitRepository } from './habit';
import { createSettingsRepository } from './settings';
import {
  createExerciseRepository,
  createRoutineRepository,
  createExerciseSessionRepository,
} from './exercises';
import { createTaskRepository, createReminderRepository } from './tasks';
import { createFocusSessionRepository } from './focus';
import { createBookRepository } from './books';
import { createRoadmapRepository } from './roadmaps';
import { createFeedSourceRepository, createArticleRepository } from './feeds';

import type {
  ActivityLogRepository,
  CategoryRepository,
  HabitRepository,
  SettingsRepository,
  ExerciseRepository,
  RoutineRepository,
  ExerciseSessionRepository,
  TaskRepository,
  ReminderRepository,
  FocusSessionRepository,
  BookRepository,
  RoadmapRepository,
  FeedSourceRepository,
  ArticleRepository,
} from './types';

export interface Repositories {
  activityLogs: ActivityLogRepository;
  categories: CategoryRepository;
  habits: HabitRepository;
  settings: SettingsRepository;
  exercises: ExerciseRepository;
  routines: RoutineRepository;
  exerciseSessions: ExerciseSessionRepository;
  tasks: TaskRepository;
  reminders: ReminderRepository;
  focusSessions: FocusSessionRepository;
  books: BookRepository;
  roadmaps: RoadmapRepository;
  feedSources: FeedSourceRepository;
  articles: ArticleRepository;
  /** Raw database instance for complex cross-table queries (like search) */
  db: SQLiteDatabase;
}

export function createRepositories(db: SQLiteDatabase): Repositories {
  return {
    activityLogs: createActivityLogRepository(db),
    categories: createCategoryRepository(db),
    habits: createHabitRepository(db),
    settings: createSettingsRepository(db),
    exercises: createExerciseRepository(db),
    routines: createRoutineRepository(db),
    exerciseSessions: createExerciseSessionRepository(db),
    tasks: createTaskRepository(db),
    reminders: createReminderRepository(db),
    focusSessions: createFocusSessionRepository(db),
    books: createBookRepository(db),
    roadmaps: createRoadmapRepository(db),
    feedSources: createFeedSourceRepository(db),
    articles: createArticleRepository(db),
    db,
  };
}

export type {
  ActivityLogRepository,
  CategoryRepository,
  HabitRepository,
  SettingsRepository,
  ExerciseRepository,
  RoutineRepository,
  ExerciseSessionRepository,
  TaskRepository,
  ReminderRepository,
  FocusSessionRepository,
  BookRepository,
  RoadmapRepository,
  FeedSourceRepository,
  ArticleRepository,
};


