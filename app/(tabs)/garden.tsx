/**
 * Garden screen — shows all plants in a living garden scene.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { Plant } from '@/src/components/garden/Plant';
import { GardenIcon, SettingsIcon } from '@/src/components/ui/Icon';
import { useGardenStore } from '@/src/stores/garden';
import { useRepositories } from '@/src/db/provider';
import { getLogicalDate, nowISO } from '@/src/utils/date';
import { useRouter, useFocusEffect } from 'expo-router';


export default function GardenScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  
  const router = useRouter();
  const repositories = useRepositories();
  const { plants, isLoading, sync } = useGardenStore();

  const [viewMode, setViewMode] = useState<'grid' | 'forest'>('grid');

  const handleRefresh = async () => {
    const settings = await repositories.settings.getAll();
    const dayStartHour = settings.dayStartHour;
    const logicalToday = getLogicalDate(nowISO(), dayStartHour);
    await sync(repositories, logicalToday);
  };

  // Sync on mount
  useFocusEffect(
    React.useCallback(() => {
      handleRefresh();
    }, [repositories])
  );

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl 
          refreshing={isLoading && plants.length > 0} 
          onRefresh={handleRefresh}
          tintColor={theme.colors.accent}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Garden</Text>
        <Pressable onPress={() => router.push('/plants' as any)} style={styles.manageButton}>
          <SettingsIcon size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>
        Your habits grow here. Each category has a plant that reflects your consistency.
      </Text>

      <View style={styles.viewToggles}>
        <Pressable 
          style={[styles.viewToggle, viewMode === 'grid' && styles.viewToggleActive]} 
          onPress={() => setViewMode('grid')}
        >
          <Text style={[styles.viewToggleText, viewMode === 'grid' && styles.viewToggleTextActive]}>Grid</Text>
        </Pressable>
        <Pressable 
          style={[styles.viewToggle, viewMode === 'forest' && styles.viewToggleActive]} 
          onPress={() => setViewMode('forest')}
        >
          <Text style={[styles.viewToggleText, viewMode === 'forest' && styles.viewToggleTextActive]}>Forest</Text>
        </Pressable>
      </View>

      {plants.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <View style={styles.iconWrap}>
            <GardenIcon size={48} color={theme.colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Seeds Planted</Text>
          <Text style={styles.emptyBody}>
            Start logging activities to watch your garden grow. Each streak waters your plants.
          </Text>
        </View>
      ) : viewMode === 'grid' ? (
        <View style={styles.grid}>
          {plants.map((plant) => (
            <Pressable 
              key={plant.habit.id} 
              style={styles.gridItem}
              onPress={() => router.push(`/plants/${plant.habit.id}` as any)}
            >
              <Plant 
                stage={plant.streak.plantStage} 
                health={plant.streak.healthState} 
                color={plant.category.color}
                label={plant.habit.name} 
                size={100} 
              />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.forestList}>
          {plants.map((plant) => (
            <Pressable 
              key={plant.habit.id} 
              style={styles.forestRow}
              onPress={() => router.push(`/plants/${plant.habit.id}` as any)}
            >
              <View style={styles.forestRowPlant}>
                <Plant 
                  stage={plant.streak.plantStage} 
                  health={plant.streak.healthState} 
                  color={plant.category.color}
                  size={60} 
                />
              </View>
              <View style={styles.forestRowInfo}>
                <Text style={styles.forestRowTitle}>{plant.habit.name}</Text>
                <Text style={styles.forestRowSubtitle}>{plant.category.name}</Text>
                <View style={styles.forestRowStats}>
                  <Text style={styles.forestRowStat}>Stage: {plant.streak.plantStage}</Text>
                  <Text style={styles.forestRowStat}>Health: {plant.streak.healthState}</Text>
                </View>
                <View style={styles.forestRowStats}>
                  <Text style={styles.forestRowStat}>Current Streak: {plant.streak.currentStreak}</Text>
                  <Text style={styles.forestRowStat}>Longest Streak: {plant.streak.longestStreak}</Text>
                </View>
              </View>
            </Pressable>
          ))}
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
      alignItems: 'center',
    },
    manageButton: {
      padding: spacing.xs,
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
      marginBottom: spacing['2xl'],
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing['5xl'],
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 20,
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    emptyBody: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -spacing.sm,
    },
    gridItem: {
      width: '33.33%',
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    viewToggles: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: 12,
      padding: 4,
      marginBottom: spacing.xl,
    },
    viewToggle: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: 8,
    },
    viewToggleActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    viewToggleText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    viewToggleTextActive: {
      fontFamily: 'Inter_600SemiBold',
      color: theme.colors.textPrimary,
    },
    forestList: {
      gap: spacing.lg,
    },
    forestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: spacing.md,
    },
    forestRowPlant: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 64,
    },
    forestRowInfo: {
      flex: 1,
    },
    forestRowTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    forestRowSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    forestRowStats: {
      alignItems: 'flex-end',
    },
    forestRowStat: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
  });
}
