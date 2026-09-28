import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { useGardenStore } from '@/src/stores/garden';
import { useRepositories } from '@/src/db/provider';
import { Plant } from '@/src/components/garden/Plant';
import { ChevronLeftIcon, FireIcon, TrophyIcon, ShieldIcon } from '@/src/components/ui/Icon';
import { getLogicalDate, nowISO, addDays, getMonthKey } from '@/src/utils/date';

export default function PlantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);

  const { plants } = useGardenStore();
  const plant = plants.find(p => p.habit.id === id);

  const [today, setToday] = useState<string>('');
  const repositories = useRepositories();

  useEffect(() => {
    async function load() {
      const settings = await repositories.settings.getAll();
      const dayStartHour = settings.dayStartHour;
      setToday(getLogicalDate(nowISO(), dayStartHour));
    }
    load();
  }, [repositories]);
  // Generate 90 days for the heatmap
  const heatmapData = useMemo(() => {
    if (!plant || !today) return [];
    const days = [];
    const map = new Map(plant.activities.map(a => [a.date, a]));
    for (let i = 89; i >= 0; i--) {
      const d = addDays(today, -i);
      const activity = map.get(d);
      days.push({
        date: d,
        fulfilled: activity?.fulfilled || false,
        rest: activity?.restTokenUsed || false,
      });
    }
    return days;
  }, [plant, today]);

  if (!plant) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyTitle}>Plant not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.colors.accent }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const { streak, category, habit } = plant;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{habit.name}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Plant Showcase */}
        <View style={styles.showcase}>
          <Plant 
            stage={streak.plantStage} 
            health={streak.healthState} 
            color={category.color} 
            size={160} 
          />
          <Text style={styles.stageText}>
            {streak.plantStage.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={[styles.healthText, { color: getHealthColor(streak.healthState, theme) }]}>
            {streak.healthState.toUpperCase()}
          </Text>
        </View>

        {/* Recovery Mode */}
        {streak.isRecovering && (
          <View style={styles.recoveryCard}>
            <ShieldIcon size={24} color={theme.colors.warning} />
            <View style={styles.recoveryTextWrap}>
              <Text style={styles.recoveryTitle}>Recovery Mode</Text>
              <Text style={styles.recoveryBody}>
                {streak.recoveryDaysRemaining} more {streak.recoveryDaysRemaining === 1 ? 'day' : 'days'} of consistency to restore full health.
              </Text>
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <FireIcon size={24} color={theme.colors.accent} />
            <Text style={styles.statValue}>{streak.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statBox}>
            <TrophyIcon size={24} color={theme.colors.success} />
            <Text style={styles.statValue}>{streak.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
        </View>

        {/* Heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 90 Days</Text>
          <View style={styles.heatmap}>
            {heatmapData.map((day, i) => (
              <View 
                key={day.date} 
                style={[
                  styles.heatmapCell,
                  day.fulfilled ? { backgroundColor: category.color } : 
                  day.rest ? { backgroundColor: theme.colors.warning } : null
                ]} 
              />
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: category.color }]} />
              <Text style={styles.legendText}>Active</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: theme.colors.warning }]} />
              <Text style={styles.legendText}>Rest</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: theme.colors.surface }]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function getHealthColor(health: string, theme: Theme) {
  if (health === 'ok') return '#7FB069';
  if (health === 'wilting') return theme.colors.warning;
  if (health === 'dying') return theme.colors.error;
  return theme.colors.accent;
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    backButton: { padding: spacing.sm },
    title: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: theme.colors.textPrimary },
    content: {
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      width: '100%',
      padding: spacing.xl,
      paddingBottom: spacing['4xl'],
    },
    showcase: {
      alignItems: 'center',
      paddingVertical: spacing['2xl'],
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    stageText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 20,
      color: theme.colors.textPrimary,
      marginTop: spacing.lg,
    },
    healthText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      marginTop: spacing.xs,
    },
    recoveryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: 16,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.warning,
    },
    recoveryTextWrap: {
      marginLeft: spacing.md,
      flex: 1,
    },
    recoveryTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    recoveryBody: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    statBox: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      padding: spacing.xl,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statValue: {
      fontFamily: 'Inter_700Bold',
      fontSize: 32,
      color: theme.colors.textPrimary,
      marginVertical: spacing.xs,
    },
    statLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    section: {
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: theme.colors.textPrimary,
      marginBottom: spacing.md,
    },
    heatmap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    heatmapCell: {
      width: 16,
      height: 16,
      borderRadius: 4,
      backgroundColor: theme.colors.background,
    },
    legend: {
      flexDirection: 'row',
      marginTop: spacing.lg,
      gap: spacing.lg,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 3,
    },
    legendText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    emptyTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
      color: theme.colors.textSecondary,
    },
  });
}
