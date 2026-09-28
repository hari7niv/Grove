/**
 * Routine Runner screen.
 * Guides the user through a sequence of exercises.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon, PlayIcon, PauseIcon, CheckIcon, ChevronRightIcon } from '@/src/components/ui/Icon';
import type { Routine, Exercise } from '@/src/types/models';
import { nowISO } from '@/src/utils/date';
import { useActivityLogger } from '@/src/hooks/useActivityLogger';

export default function RoutineRunnerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();
  const { logActivity } = useActivityLogger();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Exercise tracking state
  const [startedAt, setStartedAt] = useState<string | null>(null);

  
  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); 
  
  // Count state
  const [currentSet, setCurrentSet] = useState(1);
  const [repsCompleted, setRepsCompleted] = useState<number[]>([]);
  const [currentRepsInput, setCurrentRepsInput] = useState('');

  const setupExercise = (ex: Exercise) => {
    setStartedAt(null);
    setIsActive(false);
    if (ex.mode === 'timer') {
      setTimeRemaining(ex.targetDuration || 0);
    } else {
      setCurrentSet(1);
      setRepsCompleted([]);
      setCurrentRepsInput('');
    }
  };

  useEffect(() => {
    async function load() {
      if (!id || typeof id !== 'string') return;
      const r = await repositories.routines.getById(id);
      if (r) {
        setRoutine(r);
        const exPromises = r.exerciseIds.map(eid => repositories.exercises.getById(eid));
        const exs = (await Promise.all(exPromises)).filter(Boolean) as Exercise[];
        setExercises(exs);

        
        if (exs.length > 0) {
          setupExercise(exs[0]);
        }
      }
    }
    load();
  }, [id, repositories]);

  const currentExercise = exercises[currentIndex];

  const lastTick = React.useRef<number>(0);

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

  const nextExercise = async () => {
    if (!currentExercise || !routine) return;
    
    const end = nowISO();
    const start = startedAt || end;
    
    // Save Exercise Session
    await repositories.exerciseSessions.create({
      exerciseId: currentExercise.id,
      routineId: routine.id,
      startedAt: start,
      finishedAt: end,
      duration: currentExercise.mode === 'timer' ? (currentExercise.targetDuration || 0) - timeRemaining : null,
      setsCompleted: currentExercise.mode === 'count' ? repsCompleted.length : null,
      repsCompleted: currentExercise.mode === 'count' ? repsCompleted.reduce((a, b) => a + b, 0) : null,
      notes: null,
    });

    if (currentIndex < exercises.length - 1) {
      const nextEx = exercises[currentIndex + 1];
      setCurrentIndex(i => i + 1);
      setupExercise(nextEx);
    } else {
      finishRoutine();
    }
  };

  const finishRoutine = async () => {
    if (!routine) return;
    const end = nowISO();
    
    // Water garden using the first exercise's category for now
    const firstEx = exercises[0];
    if (firstEx && firstEx.categoryId) {
      await logActivity({
        categoryId: firstEx.categoryId,
        type: 'exercise',
        value: 1, // 1 routine
        unit: 'routine',
        metadata: JSON.stringify({ routineName: routine.name }),
        timestamp: end,
        fallbackName: `Workout (${routine.name})`
      });
    }

    router.back();
  };

  if (!routine || !currentExercise) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLast = currentIndex === exercises.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{routine.name}</Text>
        <Text style={styles.progressText}>{currentIndex + 1} / {exercises.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.exerciseName}>{currentExercise.name}</Text>
        
        {currentExercise.mode === 'timer' ? (
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
              Set {currentSet} of {currentExercise.targetSets || '?'}
            </Text>
            
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={currentRepsInput}
                onChangeText={setCurrentRepsInput}
                placeholder={currentExercise.targetReps ? String(currentExercise.targetReps) : "10"}
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
        <Pressable 
          style={isLast ? styles.finishButton : styles.nextButton} 
          onPress={nextExercise}
        >
          {isLast ? <CheckIcon size={20} color="#FFF" /> : null}
          <Text style={isLast ? styles.finishButtonText : styles.nextButtonText}>
            {isLast ? 'Finish Routine' : 'Next Exercise'}
          </Text>
          {!isLast ? <ChevronRightIcon size={20} color={theme.colors.accent} /> : null}
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
    progressText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: theme.colors.textSecondary },
    content: { padding: spacing.xl, flexGrow: 1 },
    exerciseName: {
      fontFamily: 'Inter_700Bold',
      fontSize: 28,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing['3xl'],
    },
    timerContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    timerText: { fontFamily: 'Inter_700Bold', fontSize: 72, color: theme.colors.textPrimary, fontVariant: ['tabular-nums'] },
    timerControls: { marginTop: spacing['3xl'] },
    playButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countContainer: { flex: 1 },
    setTracker: { fontFamily: 'Inter_600SemiBold', fontSize: 20, color: theme.colors.textPrimary, marginBottom: spacing.xl, textAlign: 'center' },
    inputRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: spacing['2xl'] },
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
    inputLabel: { fontFamily: 'Inter_500Medium', fontSize: 24, color: theme.colors.textSecondary, marginLeft: spacing.sm },
    logButton: {
      backgroundColor: theme.colors.surfaceRaised,
      paddingVertical: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    logButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: theme.colors.textPrimary },
    history: { marginTop: spacing['3xl'] },
    historyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: theme.colors.textSecondary, marginBottom: spacing.md },
    historyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    historyText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: theme.colors.textPrimary },
    historyValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: theme.colors.textPrimary },
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
    finishButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#FFF' },
    nextButton: {
      backgroundColor: theme.colors.accentLight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      borderRadius: 16,
      gap: spacing.sm,
    },
    nextButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: theme.colors.accent },
  });
}
