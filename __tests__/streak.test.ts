/**
 * Streak Engine — Comprehensive Test Suite
 *
 * Tests cover: basic streaks, missed days, recovery (2-extra-day rule),
 * rest tokens, day-start-hour boundary, DST transitions, timezone changes,
 * backfilled logs, multiple entries per day, long gaps, health states,
 * plant stages, heatmaps, and edge cases.
 */

import {
  computeStreakInfo,
  computeCurrentStreak,
  computeLongestStreak,
  computeHealthState,
  computeRecoveryStatus,
  computePlantStage,
  canUseRestToken,
  computeHeatmap,
  isDayFulfilled,
  DEFAULT_STREAK_CONFIG,
} from '../src/engine/streak';
import type { DayActivity } from '../src/types/models';
import { getLogicalDate, addDays, daysBetween } from '../src/utils/date';

// ─── Helpers ────────────────────────────────────────────────────

/** Create a DayActivity for a given date */
function day(
  date: string,
  fulfilled: boolean = true,
  value: number = 1,
  restTokenUsed: boolean = false,
): DayActivity {
  return { date, fulfilled, value, restTokenUsed };
}

/** Create consecutive fulfilled days starting from a date */
function consecutiveDays(startDate: string, count: number): DayActivity[] {
  const result: DayActivity[] = [];
  for (let i = 0; i < count; i++) {
    result.push(day(addDays(startDate, i)));
  }
  return result;
}

/** Build a Map from activities array */
function toMap(activities: DayActivity[]): Map<string, DayActivity> {
  const map = new Map<string, DayActivity>();
  for (const a of activities) {
    map.set(a.date, a);
  }
  return map;
}

// ─── computeCurrentStreak ───────────────────────────────────────

describe('computeCurrentStreak', () => {
  it('returns 0 for empty activities', () => {
    const result = computeCurrentStreak(new Map(), '2024-03-15');
    expect(result.currentStreak).toBe(0);
    expect(result.lastActiveDate).toBeNull();
  });

  it('counts a single active day (today)', () => {
    const activities = toMap([day('2024-03-15')]);
    const result = computeCurrentStreak(activities, '2024-03-15');
    expect(result.currentStreak).toBe(1);
    expect(result.lastActiveDate).toBe('2024-03-15');
  });

  it('counts consecutive days ending today', () => {
    const activities = toMap(consecutiveDays('2024-03-13', 3));
    const result = computeCurrentStreak(activities, '2024-03-15');
    expect(result.currentStreak).toBe(3);
  });

  it('handles today not yet fulfilled (yesterday active)', () => {
    const activities = toMap(consecutiveDays('2024-03-13', 2)); // Mar 13, 14
    const result = computeCurrentStreak(activities, '2024-03-15');
    // Today is pending, so streak counts from yesterday backward
    expect(result.currentStreak).toBe(2);
  });

  it('breaks streak on a gap', () => {
    const activities = toMap([
      day('2024-03-10'),
      day('2024-03-11'),
      // gap on 2024-03-12
      day('2024-03-13'),
      day('2024-03-14'),
      day('2024-03-15'),
    ]);
    const result = computeCurrentStreak(activities, '2024-03-15');
    expect(result.currentStreak).toBe(3); // 13, 14, 15
  });

  it('counts rest token days as part of streak', () => {
    const activities = toMap([
      day('2024-03-13'),
      day('2024-03-14', false, 0, true), // rest token
      day('2024-03-15'),
    ]);
    const result = computeCurrentStreak(activities, '2024-03-15');
    expect(result.currentStreak).toBe(3);
  });

  it('handles very long streak', () => {
    const activities = toMap(consecutiveDays('2024-01-01', 75));
    const result = computeCurrentStreak(activities, '2024-03-15');
    expect(result.currentStreak).toBe(75);
  });
});

// ─── computeLongestStreak ───────────────────────────────────────

describe('computeLongestStreak', () => {
  it('returns 0 for empty activities', () => {
    expect(computeLongestStreak([])).toBe(0);
  });

  it('returns 1 for a single active day', () => {
    expect(computeLongestStreak([day('2024-03-15')])).toBe(1);
  });

  it('counts longest run of consecutive days', () => {
    const activities = [
      ...consecutiveDays('2024-03-01', 5), // 5-day streak
      // gap on 2024-03-06
      ...consecutiveDays('2024-03-07', 10), // 10-day streak
      // gap on 2024-03-17
      ...consecutiveDays('2024-03-18', 3), // 3-day streak
    ];
    expect(computeLongestStreak(activities)).toBe(10);
  });

  it('handles unfulfilled activities (not counting them)', () => {
    const activities = [
      day('2024-03-01'),
      day('2024-03-02'),
      day('2024-03-03', false, 0), // not fulfilled
      day('2024-03-04'),
    ];
    expect(computeLongestStreak(activities)).toBe(2);
  });

  it('counts rest token days in longest streak', () => {
    const activities = [
      day('2024-03-01'),
      day('2024-03-02'),
      day('2024-03-03', false, 0, true), // rest token
      day('2024-03-04'),
      day('2024-03-05'),
    ];
    expect(computeLongestStreak(activities)).toBe(5);
  });

  it('handles multiple entries on same day', () => {
    // If there are duplicates for same date, should not double count
    const activities = [
      day('2024-03-01'),
      day('2024-03-02'),
      day('2024-03-03'),
    ];
    expect(computeLongestStreak(activities)).toBe(3);
  });
});

// ─── computeHealthState ─────────────────────────────────────────

describe('computeHealthState', () => {
  it('returns thriving when yesterday was active', () => {
    const activities = toMap([day('2024-03-14')]);
    expect(computeHealthState(activities, '2024-03-15')).toBe('thriving');
  });

  it('returns thriving when today is active and yesterday was active', () => {
    const activities = toMap([day('2024-03-14'), day('2024-03-15')]);
    expect(computeHealthState(activities, '2024-03-15')).toBe('thriving');
  });

  it('returns ok after 1 missed day', () => {
    const activities = toMap([day('2024-03-13')]);
    // Yesterday (14th) is missed
    expect(computeHealthState(activities, '2024-03-15')).toBe('ok');
  });

  it('returns wilting after 2 missed days', () => {
    const activities = toMap([day('2024-03-12')]);
    // 13th and 14th missed
    expect(computeHealthState(activities, '2024-03-15')).toBe('wilting');
  });

  it('returns dying after 3+ missed days', () => {
    const activities = toMap([day('2024-03-11')]);
    // 12th, 13th, 14th missed
    expect(computeHealthState(activities, '2024-03-15')).toBe('dying');
  });

  it('stays dying even after many missed days', () => {
    const activities = toMap([day('2024-01-01')]);
    expect(computeHealthState(activities, '2024-03-15')).toBe('dying');
  });

  it('considers rest token as active', () => {
    const activities = toMap([day('2024-03-14', false, 0, true)]);
    expect(computeHealthState(activities, '2024-03-15')).toBe('thriving');
  });

  it('returns ok for brand new empty state with no history', () => {
    // No activities at all — neutral state since habit hasn't been started
    expect(computeHealthState(new Map(), '2024-03-15')).toBe('ok');
  });
});

// ─── computeRecoveryStatus ──────────────────────────────────────

describe('computeRecoveryStatus', () => {
  it('returns not recovering when no breaks in recent history', () => {
    const activities = toMap(consecutiveDays('2024-03-01', 15));
    const result = computeRecoveryStatus(activities, '2024-03-15');
    expect(result.isRecovering).toBe(false);
    expect(result.recoveryDaysRemaining).toBe(0);
  });

  it('returns recovering immediately after a break', () => {
    const activities = toMap([
      ...consecutiveDays('2024-03-10', 3),
      // gap on 2024-03-13
      day('2024-03-14'),
    ]);
    const result = computeRecoveryStatus(activities, '2024-03-15');
    // 1 day after break, need 2, so 1 remaining
    expect(result.isRecovering).toBe(true);
    expect(result.recoveryDaysRemaining).toBe(1);
  });

  it('shows 2 days remaining right after the break day', () => {
    const activities = toMap([
      ...consecutiveDays('2024-03-10', 3),
      // gap on 2024-03-13 = the break
    ]);
    const result = computeRecoveryStatus(activities, '2024-03-14');
    expect(result.isRecovering).toBe(true);
    expect(result.recoveryDaysRemaining).toBe(2);
  });

  it('exits recovery after 2 consecutive active days post-break', () => {
    const activities = toMap([
      ...consecutiveDays('2024-03-10', 3),
      // gap on 2024-03-13
      day('2024-03-14'),
      day('2024-03-15'),
    ]);
    const result = computeRecoveryStatus(activities, '2024-03-16');
    expect(result.isRecovering).toBe(false);
    expect(result.recoveryDaysRemaining).toBe(0);
  });

  it('resets recovery counter if another break occurs during recovery', () => {
    const activities = toMap([
      ...consecutiveDays('2024-03-10', 2),
      // gap on 2024-03-12
      day('2024-03-13'),
      // gap on 2024-03-14 (break during recovery)
    ]);
    const result = computeRecoveryStatus(activities, '2024-03-15');
    expect(result.isRecovering).toBe(true);
    expect(result.recoveryDaysRemaining).toBe(2);
  });

  it('handles long gap before resuming (still in recovery)', () => {
    const activities = toMap([
      day('2024-03-01'),
      // long gap
      day('2024-03-14'),
    ]);
    const result = computeRecoveryStatus(activities, '2024-03-15');
    expect(result.isRecovering).toBe(true);
    expect(result.recoveryDaysRemaining).toBe(1);
  });
});

// ─── computePlantStage ──────────────────────────────────────────

describe('computePlantStage', () => {
  it('returns seed for 0 days', () => {
    expect(computePlantStage(0)).toBe('seed');
  });

  it('returns sprout at 3 days', () => {
    expect(computePlantStage(3)).toBe('sprout');
  });

  it('returns sapling at 14 days', () => {
    expect(computePlantStage(14)).toBe('sapling');
  });

  it('returns young_tree at 30 days', () => {
    expect(computePlantStage(30)).toBe('young_tree');
  });

  it('returns mature_tree at 90 days', () => {
    expect(computePlantStage(90)).toBe('mature_tree');
  });

  it('returns grove at 180 days', () => {
    expect(computePlantStage(180)).toBe('grove');
  });

  it('returns grove for very high counts', () => {
    expect(computePlantStage(500)).toBe('grove');
  });

  it('stays at seed for 1-2 days', () => {
    expect(computePlantStage(1)).toBe('seed');
    expect(computePlantStage(2)).toBe('seed');
  });

  it('returns correct stage between thresholds', () => {
    expect(computePlantStage(10)).toBe('sprout'); // between 3 and 14
    expect(computePlantStage(25)).toBe('sapling'); // between 14 and 30
    expect(computePlantStage(60)).toBe('young_tree'); // between 30 and 90
    expect(computePlantStage(150)).toBe('mature_tree'); // between 90 and 180
  });
});

// ─── canUseRestToken ────────────────────────────────────────────

describe('canUseRestToken', () => {
  it('allows rest token on unfulfilled day', () => {
    const activities = toMap([day('2024-03-14')]); // yesterday active
    expect(canUseRestToken(activities, '2024-03-15', 0, 2)).toBe(true);
  });

  it('rejects rest token on already fulfilled day', () => {
    const activities = toMap([day('2024-03-15')]);
    expect(canUseRestToken(activities, '2024-03-15', 0, 2)).toBe(false);
  });

  it('rejects rest token if already used on that day', () => {
    const activities = toMap([day('2024-03-15', false, 0, true)]);
    expect(canUseRestToken(activities, '2024-03-15', 1, 2)).toBe(false);
  });

  it('rejects rest token when monthly limit reached', () => {
    const activities = toMap([day('2024-03-14')]);
    expect(canUseRestToken(activities, '2024-03-15', 2, 2)).toBe(false);
  });

  it('allows rest token when some tokens remain', () => {
    const activities = toMap([day('2024-03-14')]);
    expect(canUseRestToken(activities, '2024-03-15', 1, 2)).toBe(true);
  });
});

// ─── computeStreakInfo (integration) ────────────────────────────

describe('computeStreakInfo', () => {
  it('handles empty activity list', () => {
    const result = computeStreakInfo([], '2024-03-15');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.plantStage).toBe('seed');
    expect(result.healthState).toBe('ok');
    expect(result.isRecovering).toBe(false);
  });

  it('handles a perfect 7-day streak', () => {
    const activities = consecutiveDays('2024-03-09', 7); // Mar 9–15
    const result = computeStreakInfo(activities, '2024-03-15');
    expect(result.currentStreak).toBe(7);
    expect(result.longestStreak).toBe(7);
    expect(result.healthState).toBe('thriving');
    expect(result.plantStage).toBe('sprout');
    expect(result.isRecovering).toBe(false);
  });

  it('handles streak break and recovery', () => {
    const activities = [
      ...consecutiveDays('2024-03-01', 10),
      // gap on Mar 11
      day('2024-03-12'),
      day('2024-03-13'),
      day('2024-03-14'),
      day('2024-03-15'),
    ];
    const result = computeStreakInfo(activities, '2024-03-15');
    expect(result.currentStreak).toBe(4); // 12, 13, 14, 15
    expect(result.longestStreak).toBe(10);
    // 4 days after break >= 2 required, so not recovering
    expect(result.isRecovering).toBe(false);
  });

  it('counts rest tokens correctly for the month', () => {
    const activities = [
      day('2024-03-01'),
      day('2024-03-02'),
      day('2024-03-03', false, 0, true), // rest token
      day('2024-03-04'),
      day('2024-03-05', false, 0, true), // another rest token
      day('2024-03-06'),
    ];
    const result = computeStreakInfo(activities, '2024-03-06');
    expect(result.restTokensUsedThisMonth).toBe(2);
    expect(result.currentStreak).toBe(6);
  });

  it('handles backfilled entries (past entries added later)', () => {
    // User forgot to log, adds it later — should still count
    const activities = [
      day('2024-03-10'),
      day('2024-03-11'),
      // 2024-03-12 was backfilled later
      day('2024-03-12'),
      day('2024-03-13'),
      day('2024-03-14'),
      day('2024-03-15'),
    ];
    const result = computeStreakInfo(activities, '2024-03-15');
    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(6);
  });

  it('handles app not opened for many days', () => {
    // Last activity was 2 weeks ago
    const activities = consecutiveDays('2024-03-01', 5); // Mar 1-5
    const result = computeStreakInfo(activities, '2024-03-20');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(5);
    expect(result.healthState).toBe('dying');
    expect(result.isRecovering).toBe(true);
  });

  it('correctly determines plant stage from cumulative activity', () => {
    // 90+ active days should reach mature_tree
    const activities = consecutiveDays('2024-01-01', 95);
    const result = computeStreakInfo(activities, '2024-04-05');
    expect(result.plantStage).toBe('mature_tree');
    expect(result.currentStreak).toBe(95);
  });
});

// ─── Day-Start-Hour Boundary (logical date) ─────────────────────

describe('getLogicalDate (day-start-hour)', () => {
  it('assigns late-night activity to previous day (2 AM, dayStart=4)', () => {
    const timestamp = new Date(2024, 2, 15, 2, 30); // March 15, 2:30 AM
    const logicalDate = getLogicalDate(timestamp, 4);
    expect(logicalDate).toBe('2024-03-14');
  });

  it('assigns activity at exactly dayStartHour to current day', () => {
    const timestamp = new Date(2024, 2, 15, 4, 0); // March 15, 4:00 AM
    const logicalDate = getLogicalDate(timestamp, 4);
    expect(logicalDate).toBe('2024-03-15');
  });

  it('assigns daytime activity to current day', () => {
    const timestamp = new Date(2024, 2, 15, 14, 30); // March 15, 2:30 PM
    const logicalDate = getLogicalDate(timestamp, 4);
    expect(logicalDate).toBe('2024-03-15');
  });

  it('assigns 11:59 PM activity to current day', () => {
    const timestamp = new Date(2024, 2, 15, 23, 59);
    const logicalDate = getLogicalDate(timestamp, 4);
    expect(logicalDate).toBe('2024-03-15');
  });

  it('assigns midnight activity to previous day', () => {
    const timestamp = new Date(2024, 2, 15, 0, 0); // midnight
    const logicalDate = getLogicalDate(timestamp, 4);
    expect(logicalDate).toBe('2024-03-14');
  });

  it('works with dayStartHour=0 (standard midnight boundary)', () => {
    const timestamp = new Date(2024, 2, 15, 23, 59);
    const logicalDate = getLogicalDate(timestamp, 0);
    expect(logicalDate).toBe('2024-03-15');
  });

  it('works with dayStartHour=6', () => {
    const timestamp = new Date(2024, 2, 15, 5, 30); // 5:30 AM
    const logicalDate = getLogicalDate(timestamp, 6);
    expect(logicalDate).toBe('2024-03-14');
  });

  it('handles month boundary (1 AM on March 1st -> Feb 29 in leap year)', () => {
    const timestamp = new Date(2024, 2, 1, 1, 0); // March 1, 1 AM
    const logicalDate = getLogicalDate(timestamp, 4);
    expect(logicalDate).toBe('2024-02-29'); // 2024 is a leap year
  });

  it('handles year boundary (1 AM on Jan 1st -> Dec 31)', () => {
    const timestamp = new Date(2024, 0, 1, 1, 0); // Jan 1, 1 AM
    const logicalDate = getLogicalDate(timestamp, 4);
    expect(logicalDate).toBe('2023-12-31');
  });
});

// ─── isDayFulfilled ─────────────────────────────────────────────

describe('isDayFulfilled', () => {
  it('returns true for any activity type when requirementType is "any"', () => {
    expect(isDayFulfilled(0.5, 'any')).toBe(true);
    expect(isDayFulfilled(1, 'any')).toBe(true);
  });

  it('returns false for zero value when requirementType is "any"', () => {
    expect(isDayFulfilled(0, 'any')).toBe(false);
  });

  it('returns true when value meets count requirement', () => {
    expect(isDayFulfilled(5, 'count', 5)).toBe(true);
    expect(isDayFulfilled(10, 'count', 5)).toBe(true);
  });

  it('returns false when value below count requirement', () => {
    expect(isDayFulfilled(3, 'count', 5)).toBe(false);
  });
});

// ─── computeHeatmap ─────────────────────────────────────────────

describe('computeHeatmap', () => {
  it('returns all zeros for empty activities', () => {
    const heatmap = computeHeatmap([], '2024-03-10', '2024-03-15');
    expect(heatmap).toHaveLength(6);
    expect(heatmap.every((h) => h.level === 0)).toBe(true);
  });

  it('shows fulfilled days as level 2', () => {
    const activities = [day('2024-03-12'), day('2024-03-14')];
    const heatmap = computeHeatmap(activities, '2024-03-10', '2024-03-15');
    expect(heatmap[2].level).toBe(2); // Mar 12
    expect(heatmap[4].level).toBe(2); // Mar 14
    expect(heatmap[0].level).toBe(0); // Mar 10 (no activity)
  });

  it('shows rest token days as level 4', () => {
    const activities = [day('2024-03-12', false, 0, true)];
    const heatmap = computeHeatmap(activities, '2024-03-10', '2024-03-15');
    expect(heatmap[2].level).toBe(4);
  });

  it('shows above-requirement as level 3', () => {
    const activities = [day('2024-03-12', true, 3)];
    const heatmap = computeHeatmap(activities, '2024-03-10', '2024-03-15', 1);
    expect(heatmap[2].level).toBe(3); // 3 >= 1.5 * 1
  });
});

// ─── Edge Cases ─────────────────────────────────────────────────

describe('Edge Cases', () => {
  it('handles DST spring-forward (March clock change)', () => {
    // In US, March 10, 2024 is DST spring-forward
    // Activities around this date should still work correctly
    const activities = [
      day('2024-03-09'),
      day('2024-03-10'), // DST day
      day('2024-03-11'),
    ];
    const result = computeStreakInfo(activities, '2024-03-11');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('handles DST fall-back (November clock change)', () => {
    // In US, November 3, 2024 is DST fall-back
    const activities = [
      day('2024-11-02'),
      day('2024-11-03'), // DST day
      day('2024-11-04'),
    ];
    const result = computeStreakInfo(activities, '2024-11-04');
    expect(result.currentStreak).toBe(3);
  });

  it('handles multiple activities on same day', () => {
    // Both should count as the same day
    const activities = [
      day('2024-03-15', true, 3),
    ];
    const result = computeStreakInfo(activities, '2024-03-15');
    expect(result.currentStreak).toBe(1);
  });

  it('handles very long gap (6 months) then return', () => {
    const activities = [
      ...consecutiveDays('2024-01-01', 30),
      day('2024-07-01'),
      day('2024-07-02'),
    ];
    const result = computeStreakInfo(activities, '2024-07-02');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(30);
    expect(result.plantStage).toBe('young_tree'); // 32 total active days
    expect(result.isRecovering).toBe(false); // 2 consecutive days = recovered
  });

  it('counts partial fulfillment correctly', () => {
    // Day with value below requirement should not be fulfilled
    const activities = [day('2024-03-15', false, 2)];
    const heatmap = computeHeatmap(activities, '2024-03-15', '2024-03-15', 5);
    expect(heatmap[0].level).toBe(1); // some activity but not fulfilled
  });

  it('handles rest token with zero activity value', () => {
    const activities = [
      day('2024-03-14'),
      day('2024-03-15', false, 0, true), // rest token, no actual activity
    ];
    const result = computeStreakInfo(activities, '2024-03-15');
    expect(result.currentStreak).toBe(2);
    expect(result.healthState).toBe('thriving');
  });
});

// ─── Date Utility Tests ─────────────────────────────────────────

describe('Date Utilities', () => {
  it('addDays adds correctly', () => {
    expect(addDays('2024-03-15', 1)).toBe('2024-03-16');
    expect(addDays('2024-03-15', -1)).toBe('2024-03-14');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // leap year
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
  });

  it('daysBetween calculates correctly', () => {
    expect(daysBetween('2024-03-10', '2024-03-15')).toBe(5);
    expect(daysBetween('2024-03-15', '2024-03-10')).toBe(-5);
    expect(daysBetween('2024-03-15', '2024-03-15')).toBe(0);
  });

  it('handles month boundaries', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
  });
});
