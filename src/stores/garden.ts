/**
 * Zustand store for the Garden state.
 * 
 * Computes and caches the StreakInfo for all active habits so the UI
 * can quickly render the Garden view without recalculating on every render.
 */

import { create } from 'zustand';
import type { Habit, Category, ActivityLog, StreakInfo, DayActivity } from '../types/models';
import type { Repositories } from '../db/repositories';
import { computeStreakInfo } from '../engine/streak';
import { isDayFulfilled } from '../engine/streak';

export interface GardenPlant {
  habit: Habit;
  category: Category;
  streak: StreakInfo;
}

interface GardenState {
  plants: GardenPlant[];
  isLoading: boolean;
  lastSynced: number;
  sync: (repositories: Repositories, logicalToday: string) => Promise<void>;
}

export const useGardenStore = create<GardenState>((set) => ({
  plants: [],
  isLoading: true,
  lastSynced: 0,

  sync: async (repositories, logicalToday) => {
    set({ isLoading: true });

    try {
      // 1. Fetch all active habits and categories
      const activeHabits = await repositories.habits.getActive();
      const categories = await repositories.categories.getAll();
      const categoryMap = new Map(categories.map(c => [c.id, c]));

      // 2. Fetch all activity logs and rest tokens (for now, fetching all is fine for a local DB, 
      // but in the future we might bound this to the last year)
      const allLogs = await repositories.activityLogs.getAll();
      // Note: Phase 1 doesn't have a restTokens repository yet, assuming empty for now.
      // We will add it in the future when we implement the Rest Tokens feature.

      // 3. Group activity logs by habitId
      const logsByHabit = new Map<string, ActivityLog[]>();
      for (const log of allLogs) {
        if (!log.habitId) continue;
        const list = logsByHabit.get(log.habitId) || [];
        list.push(log);
        logsByHabit.set(log.habitId, list);
      }

      const plants: GardenPlant[] = [];

      // 4. Compute streak info for each habit
      for (const habit of activeHabits) {
        const category = categoryMap.get(habit.categoryId);
        if (!category) continue;

        const habitLogs = logsByHabit.get(habit.id) || [];
        
        // Convert ActivityLog[] to DayActivity[] for the streak engine
        const dayActivities: DayActivity[] = habitLogs.map(log => ({
          date: log.logicalDate,
          fulfilled: isDayFulfilled(log.value, habit.requirementType, habit.requirementValue),
          value: log.value,
          restTokenUsed: false, // Will read from rest tokens table later
        }));

        // Default config for the streak engine
        const config = {
          recoveryDaysRequired: 2,
          monthlyRestTokens: 2,
          stageThresholds: {
            seed: 0,
            sprout: 3,
            sapling: 14,
            young_tree: 30,
            mature_tree: 90,
            grove: 180,
          },
        };

        const streak = computeStreakInfo(dayActivities, logicalToday, 2, config);

        plants.push({
          habit,
          category,
          streak,
        });
      }

      set({
        plants,
        isLoading: false,
        lastSynced: Date.now(),
      });
    } catch (error) {
      console.error('Failed to sync garden state:', error);
      set({ isLoading: false });
    }
  },
}));
