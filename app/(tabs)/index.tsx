import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth, radius, elevation } from '@/src/design/tokens';
import { useDatabase } from '@/src/db/provider';
import { useGardenStore } from '@/src/stores/garden';
import { getLogicalDate, nowISO } from '@/src/utils/date';
import type { Task, Routine } from '@/src/types/models';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { ready, repositories } = useDatabase();
  const styles = makeStyles(theme);
  
  const gardenPlants = useGardenStore((s) => s.plants);
  const syncGarden = useGardenStore((s) => s.sync);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logicalToday, setLogicalToday] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      if (ready && repositories) {
        loadData();
      }
    }, [ready, repositories])
  );

  const loadData = async () => {
    if (!repositories) return;
    try {
      const settings = await repositories.settings.getAll();
      const dayStartHour = settings.dayStartHour;
      const today = getLogicalDate(nowISO(), dayStartHour);
      setLogicalToday(today);

      await syncGarden(repositories, today);

      const allPending = await repositories.tasks.getPending();
      // Due today or overdue
      const dueTasks = allPending.filter(t => t.dueDate && t.dueDate <= today);
      setTasks(dueTasks);

      const allRoutines = await repositories.routines.getAll();
      setRoutines(allRoutines);
    } catch (e) {
      console.error(e);
    }
  };

  const unfulfilledHabits = useMemo(() => {
    return gardenPlants.filter(p => {
      const todayActivity = p.activities.find(a => a.date === logicalToday);
      return !todayActivity || !todayActivity.fulfilled;
    });
  }, [gardenPlants, logicalToday]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Habits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>Need watering today</Text>
          {unfulfilledHabits.length === 0 ? (
            <Text style={styles.emptyText}>All plants watered!</Text>
          ) : (
            <View style={styles.cardsRow}>
              {unfulfilledHabits.map(plant => (
                <View key={plant.habit.id} style={styles.card}>
                  <Text style={styles.cardIcon}>{plant.category.icon}</Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>{plant.habit.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Priority Tasks</Text>
            <Pressable onPress={() => router.push('/(tabs)/tasks')}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks due today.</Text>
          ) : (
            <View style={styles.list}>
              {tasks.map(task => (
                <Pressable
                  key={task.id}
                  style={styles.listItem}
                  onPress={() => router.push(`/task/${task.id}`)}
                >
                  <Text style={styles.listItemTitle}>{task.title}</Text>
                  {task.dueDate && <Text style={styles.listItemSubtitle}>{task.dueDate}</Text>}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Routines */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Routines</Text>
            <Pressable onPress={() => router.push('/(tabs)/exercises')}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>
          {routines.length === 0 ? (
            <Text style={styles.emptyText}>No routines created.</Text>
          ) : (
            <View style={styles.list}>
              {routines.map(routine => (
                <Pressable
                  key={routine.id}
                  style={styles.listItem}
                  onPress={() => router.push(`/routine/${routine.id}`)}
                >
                  <Text style={styles.listItemTitle}>{routine.name}</Text>
                  <Text style={styles.listItemSubtitle}>{routine.exerciseIds.length} exercises</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Floating Quick Log Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + (Platform.OS === 'web' ? spacing.xl : spacing['4xl']) }]}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/more')}
      >
        <Text style={styles.fabText}>+ Quick Log</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
    },
    content: {
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      width: '100%',
      padding: spacing.xl,
      paddingBottom: spacing['6xl'], // Room for FAB
    },
    header: {
      marginBottom: spacing['2xl'],
    },
    greeting: {
      fontFamily: 'Inter_700Bold',
      fontSize: 32,
      lineHeight: 40,
      color: theme.colors.textPrimary,
    },
    date: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      marginTop: spacing.xxs,
    },
    section: {
      marginBottom: spacing['2xl'],
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      lineHeight: 24,
      color: theme.colors.textPrimary,
    },
    seeAllText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.colors.accent,
    },
    emptyText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textTertiary,
    },
    cardsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      width: 100,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardIcon: {
      fontSize: 24,
      marginBottom: spacing.xs,
    },
    cardTitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    list: {
      backgroundColor: theme.colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    listItem: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    listItemTitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    listItemSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      backgroundColor: theme.colors.accent,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: 100,
      ...elevation.level2,
    },
    fabText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: theme.colors.surface,
    },
  });
}
