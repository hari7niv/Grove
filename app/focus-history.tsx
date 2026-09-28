import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import type { ActivityLog, Category } from '@/src/types/models';
import { ChevronLeftIcon, ClockIcon } from '@/src/components/ui/Icon';

type HistoryItem = { log: ActivityLog; category?: Category };

export default function FocusHistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();
  const styles = makeStyles(theme);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cats, logs] = await Promise.all([
          repositories.categories.getAll(),
          // In a real app we'd fetch all focus activity logs
          repositories.activityLogs.getByDateRange('2000-01-01', '2100-01-01'), // fetch all for now
        ]);
        
        const focusLogs = logs.filter(l => l.type === 'focus').sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        const catMap = new Map(cats.map(c => [c.id, c]));

        setHistory(focusLogs.map(log => ({
          log,
          category: catMap.get(log.categoryId)
        })));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [repositories]);

  const formatDuration = (val: number) => {
    const mins = Math.floor(val / 60);
    return `${mins}m`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Focus History</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <ClockIcon size={48} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Focus Sessions</Text>
            <Text style={styles.emptyBody}>
              Your completed focus sessions will appear here.
            </Text>
          </View>
        ) : (
          history.map(({ log, category }) => (
            <View key={log.id} style={styles.card}>
              <View style={[styles.colorIndicator, { backgroundColor: category?.color || theme.colors.textTertiary }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.categoryName}>{category?.name || 'Unknown'}</Text>
                  <Text style={styles.date}>{formatDate(log.timestamp)}</Text>
                </View>
                <Text style={styles.duration}>
                  {formatDuration(log.value)} focused
                </Text>
                {log.metadata && JSON.parse(log.metadata).notes && (
                  <Text style={styles.notes}>{JSON.parse(log.metadata).notes}</Text>
                )}
              </View>
            </View>
          ))
        )}
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    backButton: { padding: spacing.xs, minWidth: 48 },
    headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: theme.colors.textPrimary },
    content: {
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      width: '100%',
      padding: spacing.lg,
      paddingBottom: spacing['4xl'],
    },
    emptyState: { alignItems: 'center', marginTop: spacing['4xl'] },
    emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: theme.colors.textPrimary, marginTop: spacing.md },
    emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
    card: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    colorIndicator: { width: 6 },
    cardContent: { flex: 1, padding: spacing.lg },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    categoryName: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.colors.textPrimary },
    date: { fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.colors.textTertiary },
    duration: { fontFamily: 'Inter_500Medium', fontSize: 15, color: theme.colors.textSecondary },
    notes: { fontFamily: 'Inter_400Regular', fontSize: 14, color: theme.colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' },
  });
}
