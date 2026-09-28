/**
 * Focus Tracker Screen.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon, PlayIcon, PauseIcon, CheckIcon, XIcon } from '@/src/components/ui/Icon';
import type { Category, FocusMode } from '@/src/types/models';
import { nowISO, getToday } from '@/src/utils/date';

export default function FocusScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  // Setup state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [mode, setMode] = useState<FocusMode>('countdown');
  const [targetDurationMins, setTargetDurationMins] = useState('25');

  // Tracking state
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Review state
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function load() {
      const cats = await repositories.categories.getAll();
      setCategories(cats);
    }
    load();
  }, [repositories]);

  const lastTick = React.useRef<number>(0);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      lastTick.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTick.current) / 1000);
        if (delta > 0) {
          setElapsedSeconds(s => {
            const next = s + delta;
            // Check if countdown and finished
            if (mode === 'countdown' && next >= parseInt(targetDurationMins, 10) * 60) {
              setIsActive(false);
              setIsFinished(true);
            }
            return next;
          });
          lastTick.current += delta * 1000;
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isActive, mode, targetDurationMins]);

  const handleStart = () => {
    if (!categoryId) {
      alert('Please select a category first.');
      return;
    }
    setStartedAt(nowISO());
    setIsActive(true);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsFinished(true);
  };

  const handleSave = async () => {
    if (!startedAt || !categoryId) return;
    
    const end = nowISO();
    const actualDuration = elapsedSeconds;
    const targetSeconds = parseInt(targetDurationMins, 10) * 60;
    
    try {
      // Save FocusSession
      await repositories.focusSessions.create({
        categoryId,
        taskId: null,
        mode,
        targetDuration: mode === 'countdown' ? targetSeconds : null,
        startedAt,
        finishedAt: end,
        actualDuration,
        qualityRating,
        notes: notes.trim() || null,
      });

      // Water the garden for this category
      const habits = await repositories.habits.getByCategoryId(categoryId);
      const focusHabit = habits.find(h => h.active);

      await repositories.activityLogs.create({
        categoryId,
        habitId: focusHabit?.id || null,
        type: 'focus',
        value: actualDuration / 60, // save in minutes
        unit: 'minutes',
        metadata: JSON.stringify({ qualityRating }),
        timestamp: end,
        logicalDate: getToday(4),
      });

      router.back();
    } catch (e) {
      console.error(e);
      alert('Failed to save focus session');
    }
  };

  const handleDiscard = () => {
    router.back();
  };

  const formatTime = (totalSecs: number) => {
    if (mode === 'countdown') {
      const targetSecs = parseInt(targetDurationMins, 10) * 60 || 0;
      const rem = Math.max(0, targetSecs - totalSecs);
      const m = Math.floor(rem / 60);
      const s = rem % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    } else {
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
  };

  if (isFinished) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Session Complete</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Total Focus Time</Text>
            <Text style={styles.statsValue}>{Math.floor(elapsedSeconds / 60)} min {elapsedSeconds % 60} sec</Text>
          </View>

          <Text style={styles.label}>How was your focus?</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((r) => (
              <Pressable
                key={r}
                style={[styles.ratingBtn, qualityRating === r && styles.ratingBtnActive]}
                onPress={() => setQualityRating(r)}
              >
                <Text style={[styles.ratingText, qualityRating === r && styles.ratingTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What did you accomplish?"
            placeholderTextColor={theme.colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.xl, flexDirection: 'row', gap: spacing.md }]}>
          <Pressable style={[styles.btn, styles.btnSecondary, { flex: 1 }]} onPress={handleDiscard}>
            <Text style={[styles.btnText, { color: theme.colors.textPrimary }]}>Discard</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnPrimary, { flex: 2 }]} onPress={handleSave}>
            <Text style={styles.btnTextPrimary}>Save Session</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (startedAt) {
    // Tracking mode
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Focus Session</Text>
        </View>

        <View style={styles.trackingContainer}>
          <Text style={styles.trackingTime}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.trackingLabel}>{mode === 'countdown' ? 'Remaining' : 'Elapsed'}</Text>
          
          <View style={styles.controlsRow}>
            <Pressable 
              style={[styles.playButton, isActive && { backgroundColor: theme.colors.surfaceRaised }]} 
              onPress={() => setIsActive(!isActive)}
            >
              {isActive ? (
                <PauseIcon size={32} color={theme.colors.textPrimary} />
              ) : (
                <PlayIcon size={32} color={theme.colors.accent} />
              )}
            </Pressable>
            
            <Pressable style={styles.stopButton} onPress={handleStop}>
              <View style={styles.stopIcon} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Setup mode
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Start Focus</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {categories.map(cat => (
            <Pressable
              key={cat.id}
              style={[
                styles.chip,
                categoryId === cat.id && styles.chipActive,
                categoryId === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }
              ]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text style={[
                styles.chipText,
                categoryId === cat.id && styles.chipTextActive,
                categoryId === cat.id && { color: cat.color }
              ]}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Mode</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, mode === 'countdown' && styles.chipActive]}
            onPress={() => setMode('countdown')}
          >
            <Text style={[styles.chipText, mode === 'countdown' && styles.chipTextActive]}>Countdown</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, mode === 'stopwatch' && styles.chipActive]}
            onPress={() => setMode('stopwatch')}
          >
            <Text style={[styles.chipText, mode === 'stopwatch' && styles.chipTextActive]}>Stopwatch</Text>
          </Pressable>
        </View>

        {mode === 'countdown' && (
          <>
            <Text style={styles.label}>Target Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="25"
              placeholderTextColor={theme.colors.textTertiary}
              value={targetDurationMins}
              onChangeText={setTargetDurationMins}
              keyboardType="numeric"
            />
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.xl }]}>
        <Pressable style={styles.btnPrimary} onPress={handleStart}>
          <Text style={styles.btnTextPrimary}>Start Focusing</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: { padding: spacing.sm, marginLeft: -spacing.sm },
    title: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: theme.colors.textPrimary },
    content: { padding: spacing.xl },
    label: { fontFamily: 'Inter_500Medium', fontSize: 14, color: theme.colors.textSecondary, marginBottom: spacing.sm },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: spacing.lg,
      fontFamily: 'Inter_500Medium',
      fontSize: 17,
      color: theme.colors.textPrimary,
      marginBottom: spacing['2xl'],
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    chipRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing['2xl'] },
    chipScroll: { flexDirection: 'row', marginBottom: spacing['2xl'], overflow: 'visible' },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    chipActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
    chipText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: theme.colors.textSecondary },
    chipTextActive: { color: theme.colors.accent, fontFamily: 'Inter_600SemiBold' },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    btnPrimary: {
      backgroundColor: theme.colors.accent,
      paddingVertical: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnTextPrimary: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#FFF' },
    btnSecondary: {
      backgroundColor: theme.colors.surfaceRaised,
      paddingVertical: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    btn: {
      paddingVertical: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
    
    // Tracking UI
    trackingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trackingTime: {
      fontFamily: 'Inter_700Bold',
      fontSize: 72,
      color: theme.colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    trackingLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 17,
      color: theme.colors.textSecondary,
      marginTop: spacing.md,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing['2xl'],
      marginTop: spacing['4xl'],
    },
    playButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopIcon: {
      width: 24,
      height: 24,
      backgroundColor: theme.colors.dying,
      borderRadius: 4,
    },

    // Review UI
    statsCard: {
      backgroundColor: theme.colors.surfaceRaised,
      padding: spacing.xl,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: spacing['2xl'],
    },
    statsLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    statsValue: {
      fontFamily: 'Inter_700Bold',
      fontSize: 32,
      color: theme.colors.textPrimary,
    },
    ratingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing['2xl'],
    },
    ratingBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingBtnActive: {
      backgroundColor: theme.colors.accentLight,
      borderColor: theme.colors.accent,
    },
    ratingText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.colors.textSecondary,
    },
    ratingTextActive: {
      color: theme.colors.accent,
    },
  });
}
