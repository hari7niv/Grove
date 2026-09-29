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
  const [yearLogs, setYearLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'focus' | 'reading'>('overview');

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

      const startOfYear = new Date(end.getFullYear(), 0, 1);
      const startOfYearLogical = getLogicalDate(startOfYear.toISOString(), dayStartHour);
      const yearly = await repositories.activityLogs.getByDateRange(startOfYearLogical, endDate);
      setYearLogs(yearly);
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

  // Render Reading Tab
  const renderReading = () => {
    const readingLogs = yearLogs.filter(l => l.type === 'reading');
    const totalPages = readingLogs.filter(l => l.unit === 'pages').reduce((sum, l) => sum + (l.value || 0), 0);
    const totalMins = readingLogs.filter(l => l.unit === 'minutes').reduce((sum, l) => sum + (l.value || 0), 0);
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Yearly Reading</Text>
        <Text style={styles.subtitle}>Your reading progress this year.</Text>

        <View style={styles.insightGrid}>
          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>{totalPages}</Text>
            <Text style={styles.insightLabel}>Pages Read</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>{totalMins}</Text>
            <Text style={styles.insightLabel}>Minutes Read</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>{readingLogs.length}</Text>
            <Text style={styles.insightLabel}>Sessions</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Focus Tab
  const renderFocus = () => {
    const focusLogs = yearLogs.filter(l => l.type === 'focus');
    const totalMins = focusLogs.reduce((sum, l) => sum + Math.floor((l.value || 0) / 60), 0);
    const hours = Math.floor(totalMins / 60);
    
    // Group by category
    const byCategory = new Map<string, number>();
    focusLogs.forEach(l => {
      const catName = categories.find(c => c.id === l.categoryId)?.name || 'Uncategorized';
      byCategory.set(catName, (byCategory.get(catName) || 0) + Math.floor((l.value || 0) / 60));
    });
    
    const catArray = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
    const maxCat = catArray.length > 0 ? catArray[0][1] : 1;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Focus Time</Text>
        <Text style={styles.subtitle}>Time spent in deep work this year.</Text>
        
        <View style={styles.insightGrid}>
          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>{hours}</Text>
            <Text style={styles.insightLabel}>Hours Total</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>{focusLogs.length}</Text>
            <Text style={styles.insightLabel}>Sessions</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing.xl, fontSize: 18 }]}>Time by Category (Minutes)</Text>
        <View style={[styles.chartContainer, { marginTop: spacing.md }]}>
          {catArray.map(([name, mins], idx) => (
            <View key={idx} style={styles.barRow}>
              <View style={styles.barLabelContainer}>
                <Text style={styles.barLabel} numberOfLines={1}>{name}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { backgroundColor: theme.colors.accent, width: `${(mins / maxCat) * 100}%` }]} />
              </View>
              <Text style={styles.barValue}>{mins}</Text>
            </View>
          ))}
          {catArray.length === 0 && <Text style={styles.emptyText}>No focus sessions logged yet.</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsRow}>
        <Pressable style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]} onPress={() => setActiveTab('overview')}>
          <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.tabButtonTextActive]}>Overview</Text>
        </Pressable>
        <Pressable style={[styles.tabButton, activeTab === 'focus' && styles.tabButtonActive]} onPress={() => setActiveTab('focus')}>
          <Text style={[styles.tabButtonText, activeTab === 'focus' && styles.tabButtonTextActive]}>Focus</Text>
        </Pressable>
        <Pressable style={[styles.tabButton, activeTab === 'reading' && styles.tabButtonActive]} onPress={() => setActiveTab('reading')}>
          <Text style={[styles.tabButtonText, activeTab === 'reading' && styles.tabButtonTextActive]}>Reading</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'overview' && (
          <>
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
          </>
        )}
        {activeTab === 'reading' && renderReading()}
        {activeTab === 'focus' && renderFocus()}
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
    },
    tabsRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    tabButton: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabButtonActive: {
      borderBottomColor: theme.colors.accent,
    },
    tabButtonText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    tabButtonTextActive: {
      color: theme.colors.accent,
      fontFamily: 'Inter_600SemiBold',
    },
    tabContent: {
      paddingBottom: spacing.xl,
    },
    insightGrid: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    insightCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    insightValue: {
      fontFamily: 'Inter_700Bold',
      fontSize: 28,
      color: theme.colors.accent,
      marginBottom: 4,
    },
    insightLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    emptyText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.md,
    }
  });
}
