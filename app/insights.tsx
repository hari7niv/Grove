/**
 * Insights and Weekly Review Screen.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { ChevronLeftIcon } from '@/src/components/ui/Icon';
import type { ActivityLog, Category } from '@/src/types/models';
import { getLogicalDate } from '@/src/utils/date';

export default function InsightsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const repositories = useRepositories();

  const [categories, setCategories] = useState<Category[]>([]);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    async function load() {
      const cats = await repositories.categories.getAll();
      setCategories(cats);

      // Get last 7 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      
      const settings = await repositories.settings.getAll();
      const dayStartHour = settings.dayStartHour;

      const endDate = getLogicalDate(end.toISOString(), dayStartHour);
      const startDate = getLogicalDate(start.toISOString(), dayStartHour);

      const logs = await repositories.activityLogs.getByDateRange(startDate, endDate);
      setRecentLogs(logs);
    }
    load();
  }, [repositories]);

  // Group logs by category
  const categoryStats = categories.map(cat => {
    const logs = recentLogs.filter(l => l.categoryId === cat.id);
    const count = logs.length;
    // Calculate total values. 
    // Tasks: value=1 task. Focus: value=X minutes. Exercises: value=X routines/reps.
    // To keep it simple, we just show event counts for now.
    return { ...cat, count };
  }).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...categoryStats.map(s => s.count), 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Past 7 Days</Text>
        <Text style={styles.subtitle}>Activity count by category.</Text>

        <View style={styles.chartContainer}>
          {categoryStats.map(stat => (
            <View key={stat.id} style={styles.barRow}>
              <View style={styles.barLabelContainer}>
                <Text style={styles.barLabel} numberOfLines={1}>{stat.name}</Text>
              </View>
              <View style={styles.barTrack}>
                <View 
                  style={[
                    styles.barFill, 
                    { backgroundColor: stat.color, width: `${(stat.count / maxCount) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.barValue}>{stat.count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Weekly Review</Text>
          <Text style={styles.summaryText}>
            You logged {recentLogs.length} activities in the past 7 days. 
            {categoryStats[0]?.count > 0 ? ` Your most active category was ${categoryStats[0].name}.` : ' Time to get started!'}
          </Text>
        </View>
      </ScrollView>
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
    sectionTitle: {
      fontFamily: 'Inter_700Bold',
      fontSize: 24,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing['2xl'],
    },
    chartContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing['2xl'],
      gap: spacing.lg,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    barLabelContainer: {
      width: 80,
    },
    barLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    barTrack: {
      flex: 1,
      height: 12,
      backgroundColor: theme.colors.background,
      borderRadius: 6,
      marginHorizontal: spacing.md,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 6,
    },
    barValue: {
      width: 24,
      textAlign: 'right',
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    summaryCard: {
      backgroundColor: theme.colors.accentLight,
      borderRadius: 16,
      padding: spacing.xl,
    },
    summaryTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.colors.accent,
      marginBottom: spacing.xs,
    },
    summaryText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: theme.colors.textPrimary,
      lineHeight: 22,
    }
  });
}
