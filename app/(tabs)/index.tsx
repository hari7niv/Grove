/**
 * Home / "Today" screen — daily landing page.
 *
 * Phase 1: Placeholder with design system applied.
 * Phase 2+: Full implementation with garden summary, tasks, quick actions.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { useDatabase, useRepositories } from '@/src/db/provider';
import { LeafIcon } from '@/src/components/ui/Icon';
import { seedDatabase } from '@/src/utils/seed';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { ready, error, repositories } = useDatabase();
  const styles = makeStyles(theme);

  return (
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

      {/* Database status */}
      <View style={styles.statusCard}>
        <View style={styles.statusIconWrap}>
          <LeafIcon size={32} color={theme.colors.accent} />
        </View>
        <Text style={styles.statusTitle}>
          {error ? 'Database Error' : ready ? 'Grove is Ready' : 'Initializing...'}
        </Text>
        <Text style={styles.statusBody}>
          {error
            ? `Failed to initialize: ${error.message}`
            : ready
              ? 'Your personal garden is growing. Start logging activities to water your plants.'
              : 'Setting up your local database...'}
        </Text>
      </View>

      {/* Quick actions placeholder */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {['Start Workout', 'Start Focus', 'Add Task', 'Log Reading'].map(
          (action) => (
            <View key={action} style={styles.quickAction}>
              <Text style={styles.quickActionText}>{action}</Text>
            </View>
          ),
        )}
        
        {/* Development only: Seed database button */}
        {ready && repositories && (
          <Pressable 
            style={[styles.quickAction, { backgroundColor: theme.colors.accentLight }]} 
            onPress={async () => {
              await seedDatabase(repositories);
              alert('Seeding complete! Check the Garden tab.');
            }}
          >
            <Text style={[styles.quickActionText, { color: theme.colors.accent }]}>Seed Demo Data</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      width: '100%',
      padding: spacing.xl,
      paddingBottom: spacing['4xl'],
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
    statusCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: spacing.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: spacing['2xl'],
      alignItems: 'center',
    },
    statusIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    statusTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 20,
      lineHeight: 28,
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    statusBody: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      lineHeight: 24,
      color: theme.colors.textPrimary,
      marginBottom: spacing.md,
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    quickAction: {
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      minHeight: 44,
      justifyContent: 'center',
    },
    quickActionText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: theme.colors.accent,
    },
  });
}
