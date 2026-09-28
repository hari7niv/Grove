/**
 * Exercises screen — exercise tracker.
 * Phase 3: Exercise listing and routine management.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { FitnessIcon, ClockIcon, TargetIcon, PlayIcon } from '@/src/components/ui/Icon';
import { useRepositories } from '@/src/db/provider';
import type { Exercise, Routine } from '@/src/types/models';

export default function ExercisesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(theme);
  
  const repositories = useRepositories();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exercises' | 'routines'>('exercises');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [exs, rts] = await Promise.all([
        repositories.exercises.getAll(),
        repositories.routines.getAll()
      ]);
      setExercises(exs);
      setRoutines(rts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repositories, activeTab]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={theme.colors.accent} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Exercises</Text>
          <Text style={styles.subtitle}>Track workouts and routines.</Text>
        </View>
        <Pressable 
          style={styles.addButton}
          onPress={() => {
            if (activeTab === 'routines') {
              router.push('/routine/new' as any);
            } else {
              router.push('/exercise/new' as any);
            }
          }}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable 
          style={[styles.tab, activeTab === 'exercises' && styles.tabActive]}
          onPress={() => setActiveTab('exercises')}
        >
          <Text style={[styles.tabText, activeTab === 'exercises' && styles.tabTextActive]}>Exercises</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'routines' && styles.tabActive]}
          onPress={() => setActiveTab('routines')}
        >
          <Text style={[styles.tabText, activeTab === 'routines' && styles.tabTextActive]}>Routines</Text>
        </Pressable>
      </View>

      {activeTab === 'exercises' ? (
        exercises.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <View style={styles.iconWrap}>
              <FitnessIcon size={48} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Exercises Yet</Text>
            <Text style={styles.emptyBody}>
              Create your first exercise to start tracking. Choose timer-based or count-based.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {exercises.map((exercise) => (
              <Pressable 
                key={exercise.id} 
                style={styles.card}
                onPress={() => router.push(`/exercise/${exercise.id}` as any)}
              >
                <View style={styles.cardIcon}>
                  {exercise.mode === 'timer' ? (
                    <ClockIcon size={24} color={theme.colors.accent} />
                  ) : (
                    <TargetIcon size={24} color={theme.colors.accent} />
                  )}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{exercise.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {exercise.mode === 'timer' 
                      ? `${exercise.targetSets || 0} sets of ${exercise.targetDuration || 0}s` 
                      : `${exercise.targetSets || 0} sets of ${exercise.targetReps || 0} reps`}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )
      ) : (
        routines.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <View style={styles.iconWrap}>
              <FitnessIcon size={48} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Routines</Text>
            <Text style={styles.emptyBody}>
              Group your exercises into a routine to run them sequentially.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {routines.map((routine) => (
              <Pressable 
                key={routine.id} 
                style={styles.card}
                onPress={() => alert('Routine runner coming next!')}
              >
                <View style={styles.cardIcon}>
                  <PlayIcon size={24} color={theme.colors.accent} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{routine.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {routine.exerciseIds.length} exercises
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )
      )}
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      width: '100%',
      padding: spacing.xl,
      paddingBottom: spacing['4xl'],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xl,
    },
    title: {
      fontFamily: 'Inter_700Bold',
      fontSize: 32,
      lineHeight: 40,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      marginTop: spacing.xs,
    },
    addButton: {
      backgroundColor: theme.colors.accent,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 999,
    },
    addButtonText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: '#FFF',
    },
    tabs: {
      flexDirection: 'row',
      marginBottom: spacing['2xl'],
      backgroundColor: theme.colors.surfaceRaised,
      padding: 4,
      borderRadius: 12,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    list: { gap: spacing.md },
    card: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    cardContent: { flex: 1 },
    cardTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emptyState: { alignItems: 'center', paddingVertical: spacing['5xl'] },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 20, color: theme.colors.textPrimary, marginBottom: spacing.xs },
    emptyBody: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
  });
}
