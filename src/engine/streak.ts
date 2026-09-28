/**
 * Streak Engine — Pure computation module.
 *
 * Computes streak information, health states, and plant stages
 * from activity data. Has ZERO UI or database dependencies.
 *
 * Key concepts:
 * - A streak is a run of consecutive logical days where the habit requirement is met.
 * - Missing a day drops health one level (thriving -> ok -> wilting -> dying).
 * - Recovery after a miss requires 2 extra consecutive days beyond the normal requirement.
 * - Rest tokens protect a streak for a day without doing the activity.
 * - Plant stage advances with total streak days (cumulative, including past streaks).
 */

import type { HealthState, PlantStage, DayActivity, StreakInfo } from '../types/models';
import { addDays, daysBetween, getMonthKey } from '../utils/date';

// ─── Configuration ──────────────────────────────────────────────

export interface StreakConfig {
  /** How many consecutive recovery days needed after a miss (default: 2) */
  recoveryDaysRequired: number;
  /** Stage thresholds: how many cumulative streak days to reach each stage */
  stageThresholds: Record<PlantStage, number>;
}

export const DEFAULT_STREAK_CONFIG: StreakConfig = {
  recoveryDaysRequired: 2,
  stageThresholds: {
    seed: 0,
    sprout: 3,
    sapling: 14,
    young_tree: 30,
    mature_tree: 90,
    grove: 180,
  },
};

// ─── Stage ordered for comparison ───────────────────────────────

const STAGE_ORDER: PlantStage[] = [
  'seed', 'sprout', 'sapling', 'young_tree', 'mature_tree', 'grove',
];

const HEALTH_ORDER: HealthState[] = ['thriving', 'ok', 'wilting', 'dying'];

// ─── Core Functions ─────────────────────────────────────────────

/**
 * Given a sorted array of DayActivity entries and today's date,
 * compute the full streak info for a habit.
 *
 * @param activities - array of DayActivity, sorted by date ascending.
 *                     Should cover enough history for meaningful streaks.
 * @param today - the current logical date (YYYY-MM-DD).
 * @param restTokensPerMonth - max rest tokens allowed per month.
 * @param config - streak configuration.
 */
export function computeStreakInfo(
  activities: DayActivity[],
  today: string,
  restTokensPerMonth: number = 2,
  config: StreakConfig = DEFAULT_STREAK_CONFIG,
): StreakInfo {
  if (activities.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      healthState: 'ok',
      plantStage: 'seed',
      isRecovering: false,
      recoveryDaysRemaining: 0,
      restTokensUsedThisMonth: 0,
    };
  }

  // Build a map for fast lookup: date -> DayActivity
  const activityMap = new Map<string, DayActivity>();
  for (const a of activities) {
    activityMap.set(a.date, a);
  }

  // Count rest tokens used in the current month
  const currentMonth = getMonthKey(today);
  const restTokensUsedThisMonth = activities.filter(
    (a) => a.restTokenUsed && getMonthKey(a.date) === currentMonth,
  ).length;

  // Calculate current streak by walking backward from today
  const { currentStreak, lastActiveDate } = computeCurrentStreak(
    activityMap,
    today,
  );

  // Calculate longest streak by scanning all activities
  const longestStreak = computeLongestStreak(activities);

  // Calculate health state based on missed days from today
  const healthState = computeHealthState(activityMap, today);

  // Determine recovery status
  const { isRecovering, recoveryDaysRemaining } = computeRecoveryStatus(
    activityMap,
    today,
    config.recoveryDaysRequired,
  );

  // Compute cumulative active days for plant stage
  const totalActiveDays = activities.filter((a) => a.fulfilled || a.restTokenUsed).length;
  const plantStage = computePlantStage(totalActiveDays, config.stageThresholds);

  return {
    currentStreak,
    longestStreak,
    lastActiveDate,
    healthState,
    plantStage,
    isRecovering,
    recoveryDaysRemaining,
    restTokensUsedThisMonth,
  };
}

/**
 * Compute the current streak by walking backwards from today.
 * A "fulfilled" day or a "rest token used" day counts as maintaining the streak.
 * The first gap breaks it.
 */
export function computeCurrentStreak(
  activityMap: Map<string, DayActivity>,
  today: string,
): { currentStreak: number; lastActiveDate: string | null } {
  let currentStreak = 0;
  let lastActiveDate: string | null = null;
  let currentDate = today;

  // Walk backward from today
  while (true) {
    const entry = activityMap.get(currentDate);

    if (entry && (entry.fulfilled || entry.restTokenUsed)) {
      currentStreak++;
      if (!lastActiveDate) {
        lastActiveDate = currentDate;
      }
      currentDate = addDays(currentDate, -1);
    } else if (currentDate === today) {
      // Today hasn't been fulfilled yet — that's okay, check yesterday
      // Today doesn't break the streak, it's just "pending"
      currentDate = addDays(currentDate, -1);
    } else {
      // Hit a gap — streak is broken here
      break;
    }
  }

  // If we didn't count today but yesterday was active, last active is yesterday
  if (!lastActiveDate && currentStreak === 0) {
    // Check if yesterday was the last active
    const yesterday = addDays(today, -1);
    const yesterdayEntry = activityMap.get(yesterday);
    if (yesterdayEntry && (yesterdayEntry.fulfilled || yesterdayEntry.restTokenUsed)) {
      lastActiveDate = yesterday;
    }
  }

  return { currentStreak, lastActiveDate };
}

/**
 * Compute the longest streak from a list of activities.
 * Walk through all activities chronologically.
 */
export function computeLongestStreak(activities: DayActivity[]): number {
  if (activities.length === 0) return 0;

  let longest = 0;
  let current = 0;
  let prevDate: string | null = null;

  for (const activity of activities) {
    if (!activity.fulfilled && !activity.restTokenUsed) {
      current = 0;
      prevDate = activity.date;
      continue;
    }

    if (prevDate === null) {
      current = 1;
    } else {
      const gap = daysBetween(prevDate, activity.date);
      if (gap === 1) {
        // Consecutive day
        current++;
      } else if (gap === 0) {
        // Same day, don't double count
      } else {
        // Gap — start new streak
        current = 1;
      }
    }

    prevDate = activity.date;
    longest = Math.max(longest, current);
  }

  return longest;
}

/**
 * Compute health state based on how many consecutive days have been missed
 * leading up to today.
 *
 * 0 missed: thriving
 * 1 missed: ok
 * 2 missed: wilting
 * 3+ missed: dying
 */
export function computeHealthState(
  activityMap: Map<string, DayActivity>,
  today: string,
): HealthState {
  // Brand new habit with no history — neutral state, not neglected
  if (activityMap.size === 0) return 'ok';

  // Check from yesterday backward (today is still in progress)
  let missedDays = 0;
  let checkDate = addDays(today, -1);

  for (let i = 0; i < 4; i++) {
    const entry = activityMap.get(checkDate);
    if (entry && (entry.fulfilled || entry.restTokenUsed)) {
      break;
    }
    missedDays++;
    checkDate = addDays(checkDate, -1);
  }

  // Also check today: if today is fulfilled, we're in good shape regardless
  const todayEntry = activityMap.get(today);
  if (todayEntry && (todayEntry.fulfilled || todayEntry.restTokenUsed)) {
    return missedDays === 0 ? 'thriving' : HEALTH_ORDER[Math.min(missedDays, 3)];
  }

  return HEALTH_ORDER[Math.min(missedDays, 3)] as HealthState;
}

/**
 * Determine if the habit is in recovery mode.
 *
 * Recovery mode begins after a streak break (a missed day that wasn't covered
 * by a rest token). To exit recovery, the user needs `recoveryDaysRequired`
 * extra consecutive active days.
 *
 * For example, with recoveryDaysRequired=2: after missing a day, the user must
 * do the habit for 2 consecutive days to return to normal.
 */
export function computeRecoveryStatus(
  activityMap: Map<string, DayActivity>,
  today: string,
  recoveryDaysRequired: number = 2,
): { isRecovering: boolean; recoveryDaysRemaining: number } {
  // Walk backwards from yesterday to find the last break
  let lastBreakDate: string | null = null;
  let checkDate = addDays(today, -1);

  // Look back up to 30 days
  for (let i = 0; i < 30; i++) {
    const entry = activityMap.get(checkDate);
    if (!entry || (!entry.fulfilled && !entry.restTokenUsed)) {
      lastBreakDate = checkDate;
      break;
    }
    checkDate = addDays(checkDate, -1);
  }

  if (!lastBreakDate) {
    // No break found in the last 30 days — not recovering
    return { isRecovering: false, recoveryDaysRemaining: 0 };
  }

  // Count consecutive active days AFTER the break
  let consecutiveAfterBreak = 0;
  let countDate = addDays(lastBreakDate, 1);

  while (daysBetween(countDate, today) >= 0) {
    const entry = activityMap.get(countDate);
    if (entry && entry.fulfilled) {
      consecutiveAfterBreak++;
    } else if (countDate !== today) {
      // Another break during recovery resets the recovery counter
      consecutiveAfterBreak = 0;
    }
    // Don't count today as a break (it's still in progress)
    countDate = addDays(countDate, 1);
  }

  if (consecutiveAfterBreak >= recoveryDaysRequired) {
    return { isRecovering: false, recoveryDaysRemaining: 0 };
  }

  return {
    isRecovering: true,
    recoveryDaysRemaining: recoveryDaysRequired - consecutiveAfterBreak,
  };
}

/**
 * Determine the plant stage based on cumulative active days.
 */
export function computePlantStage(
  totalActiveDays: number,
  thresholds: Record<PlantStage, number> = DEFAULT_STREAK_CONFIG.stageThresholds,
): PlantStage {
  // Walk through stages in reverse order to find the highest one reached
  for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
    const stage = STAGE_ORDER[i];
    if (totalActiveDays >= thresholds[stage]) {
      return stage;
    }
  }
  return 'seed';
}

/**
 * Check whether a rest token can be used for a given date.
 *
 * Rules:
 * - The date must not already have activity logged.
 * - The date must not already have a rest token used.
 * - The number of rest tokens used this month must be < restTokensPerMonth.
 */
export function canUseRestToken(
  activityMap: Map<string, DayActivity>,
  date: string,
  restTokensUsedThisMonth: number,
  restTokensPerMonth: number,
): boolean {
  const entry = activityMap.get(date);

  // Already fulfilled — no need for rest token
  if (entry?.fulfilled) return false;

  // Already used a rest token on this date
  if (entry?.restTokenUsed) return false;

  // Monthly limit reached
  if (restTokensUsedThisMonth >= restTokensPerMonth) return false;

  return true;
}

/**
 * Compute a heatmap for a date range, showing activity intensity per day.
 * Returns an array of { date, level } where level is 0–4.
 *
 * 0 = no activity
 * 1 = some (below requirement)
 * 2 = requirement met
 * 3 = above requirement
 * 4 = rest token used
 */
export function computeHeatmap(
  activities: DayActivity[],
  startDate: string,
  endDate: string,
  requirementValue: number = 1,
): Array<{ date: string; level: number }> {
  const activityMap = new Map<string, DayActivity>();
  for (const a of activities) {
    activityMap.set(a.date, a);
  }

  const result: Array<{ date: string; level: number }> = [];
  const totalDays = daysBetween(startDate, endDate);

  for (let i = 0; i <= totalDays; i++) {
    const date = addDays(startDate, i);
    const entry = activityMap.get(date);

    if (!entry) {
      result.push({ date, level: 0 });
    } else if (entry.restTokenUsed) {
      result.push({ date, level: 4 });
    } else if (entry.value >= requirementValue * 1.5) {
      result.push({ date, level: 3 });
    } else if (entry.fulfilled) {
      result.push({ date, level: 2 });
    } else if (entry.value > 0) {
      result.push({ date, level: 1 });
    } else {
      result.push({ date, level: 0 });
    }
  }

  return result;
}

/**
 * Determine if a day's activities fulfill the habit requirement.
 *
 * @param activities - all activities for a single day matching this habit.
 * @param requirementType - 'any' (just needs at least one) or 'count' (sum must meet value).
 * @param requirementValue - the target value (default 1).
 */
export function isDayFulfilled(
  dayValue: number,
  requirementType: 'any' | 'count',
  requirementValue: number = 1,
): boolean {
  if (requirementType === 'any') {
    return dayValue > 0;
  }
  return dayValue >= requirementValue;
}
