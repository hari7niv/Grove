/**
 * Exercise Session tracker screen.
 * Handles both timer and count-based exercises.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon, PlayIcon, PauseIcon, CheckIcon } from '@/src/components/ui/Icon';
import type { Exercise } from '@/src/types/models';
import { nowISO, getLogicalDate } from '@/src/utils/date';

export default function ExerciseSessionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  
  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  
  // Count state
  const [currentSet, setCurrentSet] = useState(1);
  const [repsCompleted, setRepsCompleted] = useState<number[]>([]);
  const [currentRepsInput, setCurrentRepsInput] = useState('');

  // Overall session state
  const [startedAt, setStartedAt] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id || typeof id !== 'string') return;
      const ex = await repositories.exercises.getById(id);
      if (ex) {
        setExercise(ex);
        if (ex.mode === 'timer') {
          setTimeRemaining(ex.targetDuration || 0);
        }
      }
    }
    load();
  }, [id, repositories]);

  const lastTick = React.useRef<number>(0);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeRemaining > 0) {
      lastTick.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTick.current) / 1000);
        if (delta > 0) {
          setTimeRemaining((time) => {
            const next = Math.max(0, time - delta);
            if (next === 0) setIsActive(false);
            return next;
          });
          lastTick.current += delta * 1000;
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  const toggleTimer = () => {
    if (!startedAt) setStartedAt(nowISO());
    setIsActive(!isActive);
  };

  const logSet = () => {
    if (!startedAt) setStartedAt(nowISO());
    const reps = parseInt(currentRepsInput, 10);
    if (!isNaN(reps) && reps > 0) {
      setRepsCompleted([...repsCompleted, reps]);
      setCurrentSet(s => s + 1);
      setCurrentRepsInput('');
    }
  };

  const finishWorkout = async () => {
    if (!exercise) return;
    
    const end = nowISO();
    const start = startedAt || end;
    
    // 1. Save Exercise Session
    await repositories.exerciseSessions.create({
      exerciseId: exercise.id,
      routineId: null,
      startedAt: start,
      finishedAt: end,
      duration: exercise.mode === 'timer' ? (exercise.targetDuration || 0) - timeRemaining : null,
      setsCompleted: exercise.mode === 'count' ? repsCompleted.length : null,
      repsCompleted: exercise.mode === 'count' ? repsCompleted.reduce((a, b) => a + b, 0) : null,
      notes: null,
    });

    // 2. Save ActivityLog to water the garden!
    if (exercise.categoryId) {
      // Find habit related to this category for exercise
      const habits = await repositories.habits.getByCategoryId(exercise.categoryId);
      const workoutHabit = habits.find(h => h.active);
      
      const value = exercise.mode === 'count' ? repsCompleted.reduce((a, b) => a + b, 0) : 1;
      
      await repositories.activityLogs.create({
        categoryId: exercise.categoryId,
        habitId: workoutHabit?.id || null,
        type: 'exercise',
        value: value,
        unit: exercise.mode === 'count' ? 'reps' : 'session',
        metadata: JSON.stringify({ exerciseName: exercise.name }),
        timestamp: end,
        logicalDate: getLogicalDate(end, 4), // hardcoded dayStartHour for now
      });
    }

    router.back();
  };

  if (!exercise) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{exercise.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {exercise.mode === 'timer' ? (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            
            <View style={styles.timerControls}>
              <Pressable 
                style={[styles.playButton, isActive && { backgroundColor: theme.colors.surfaceRaised }]} 
                onPress={toggleTimer}
              >
                {isActive ? (
                  <PauseIcon size={32} color={theme.colors.textPrimary} />
                ) : (
                  <PlayIcon size={32} color={theme.colors.accent} />
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.countContainer}>
            <Text style={styles.setTracker}>
              Set {currentSet} of {exercise.targetSets || '?'}
            </Text>
            
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={currentRepsInput}
                onChangeText={setCurrentRepsInput}
                placeholder={exercise.targetReps ? String(exercise.targetReps) : "10"}
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
              />
              <Text style={styles.inputLabel}>reps</Text>
            </View>

            <Pressable 
              style={[styles.logButton, !currentRepsInput && { opacity: 0.5 }]} 
              onPress={logSet}
              disabled={!currentRepsInput}
            >
              <Text style={styles.logButtonText}>Log Set</Text>
            </Pressable>

            {repsCompleted.length > 0 && (
              <View style={styles.history}>
                <Text style={styles.historyTitle}>Completed</Text>
                {repsCompleted.map((reps, i) => (
                  <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyText}>Set {i + 1}</Text>
                    <Text style={styles.historyValue}>{reps} reps</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.xl }]}>
        <Pressable style={styles.finishButton} onPress={finishWorkout}>
          <CheckIcon size={20} color="#FFF" />
          <Text style={styles.finishButtonText}>Finish Workout</Text>
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
    backButton: {
      padding: spacing.sm,
      marginLeft: -spacing.sm,
    },
    title: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.colors.textPrimary,
    },
    content: {
      padding: spacing.xl,
      flexGrow: 1,
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    timerText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 72,
      color: theme.colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    timerControls: {
      marginTop: spacing['3xl'],
    },
    playButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countContainer: {
      flex: 1,
    },
    setTracker: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 20,
      color: theme.colors.textPrimary,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginBottom: spacing['2xl'],
    },
    input: {
      fontFamily: 'Inter_700Bold',
      fontSize: 64,
      color: theme.colors.textPrimary,
      minWidth: 120,
      textAlign: 'center',
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.border,
      paddingBottom: 0,
    },
    inputLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 24,
      color: theme.colors.textSecondary,
      marginLeft: spacing.sm,
    },
    logButton: {
      backgroundColor: theme.colors.surfaceRaised,
      paddingVertical: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    logButtonText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.colors.textPrimary,
    },
    history: {
      marginTop: spacing['3xl'],
    },
    historyTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: spacing.md,
    },
    historyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    historyText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    historyValue: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    finishButton: {
      backgroundColor: theme.colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      borderRadius: 16,
      gap: spacing.sm,
    },
    finishButtonText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: '#FFF',
    },
  });
}
