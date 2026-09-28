/**
 * Tasks screen — task management and schedule.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { TasksIcon, PlusIcon, CheckIcon } from '@/src/components/ui/Icon';
import { useRepositories } from '@/src/db/provider';
import type { Task } from '@/src/types/models';
import { getToday } from '@/src/utils/date';

export default function TasksScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(theme);
  
  const repositories = useRepositories();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await repositories.tasks.getPending();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [repositories]);

  const toggleTask = async (task: Task) => {
    try {
      await repositories.tasks.update(task.id, { 
        status: 'done', 
        completedAt: new Date().toISOString() 
      });
      
      // If task has a category, water that category's plant
      if (task.categoryId) {
        const habits = await repositories.habits.getByCategoryId(task.categoryId);
        const taskHabit = habits.find(h => h.active);
        
        await repositories.activityLogs.create({
          categoryId: task.categoryId,
          habitId: taskHabit?.id || null,
          type: 'task',
          value: 1,
          unit: 'task',
          metadata: JSON.stringify({ taskTitle: task.title }),
          timestamp: new Date().toISOString(),
          logicalDate: getToday(4), // using default dayStartHour
        });
      }
      
      // Optimistic update
      setTasks(tasks.filter(t => t.id !== task.id));
    } catch (e) {
      console.error('Failed to complete task', e);
    }
  };

  const todayStr = getToday(4);

  const overdue = tasks.filter(t => t.dueDate && t.dueDate < todayStr);
  const today = tasks.filter(t => t.dueDate === todayStr);
  const upcoming = tasks.filter(t => t.dueDate && t.dueDate > todayStr);
  const someday = tasks.filter(t => !t.dueDate);

  const renderTask = (task: Task) => (
    <Pressable 
      key={task.id} 
      style={styles.taskCard}
      onPress={() => router.push(`/task/${task.id}` as any)}
    >
      <Pressable 
        style={styles.checkbox} 
        onPress={() => toggleTask(task)}
        hitSlop={12}
      >
        <CheckIcon size={14} color="transparent" />
      </Pressable>
      
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        {(task.description || task.dueTime) && (
          <Text style={styles.taskSubtitle} numberOfLines={1}>
            {task.dueTime ? `${task.dueTime} • ` : ''}{task.description}
          </Text>
        )}
      </View>
      
      {task.priority === 'urgent' && <View style={[styles.priorityDot, { backgroundColor: theme.colors.dying }]} />}
      {task.priority === 'high' && <View style={[styles.priorityDot, { backgroundColor: theme.colors.wilting }]} />}
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading && tasks.length > 0} onRefresh={loadTasks} tintColor={theme.colors.accent} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>Manage your to-dos & schedule.</Text>
        </View>
        <Pressable 
          style={styles.addButton}
          onPress={() => router.push('/task/new' as any)}
        >
          <PlusIcon size={20} color="#FFF" />
        </Pressable>
      </View>

      {tasks.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <View style={styles.iconWrap}>
            <TasksIcon size={48} color={theme.colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>All Clear</Text>
          <Text style={styles.emptyBody}>
            No pending tasks. Add a new task to get organized.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {overdue.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.dying }]}>Overdue</Text>
              {overdue.map(renderTask)}
            </View>
          )}
          
          {today.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today</Text>
              {today.map(renderTask)}
            </View>
          )}

          {upcoming.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {upcoming.map(renderTask)}
            </View>
          )}

          {someday.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Someday</Text>
              {someday.map(renderTask)}
            </View>
          )}
        </View>
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
      marginBottom: spacing['2xl'],
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
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: {
      gap: spacing['2xl'],
    },
    section: {
      gap: spacing.md,
    },
    sectionTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    taskCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.textTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    taskContent: {
      flex: 1,
    },
    taskTitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    taskSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: spacing.sm,
    },
    emptyState: { alignItems: 'center', paddingVertical: spacing['5xl'] },
    iconWrap: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: theme.colors.surfaceRaised,
      alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontFamily: 'Inter_600SemiBold', fontSize: 20,
      color: theme.colors.textPrimary, marginBottom: spacing.xs,
    },
    emptyBody: {
      fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22,
      color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 300,
    },
  });
}
