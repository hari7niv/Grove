/**
 * Garden screen — shows all plants in a living garden scene.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { Plant } from '@/src/components/garden/Plant';
import { GardenIcon } from '@/src/components/ui/Icon';
import { useGardenStore } from '@/src/stores/garden';
import { useRepositories } from '@/src/db/provider';
import { getLogicalDate, nowISO } from '@/src/utils/date';

// Hardcoded for now until we build the settings UI
const SETTINGS_DAY_START_HOUR = 4; 

export default function GardenScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  
  const repositories = useRepositories();
  const { plants, isLoading, sync } = useGardenStore();

  const handleRefresh = () => {
    const logicalToday = getLogicalDate(nowISO(), SETTINGS_DAY_START_HOUR);
    sync(repositories, logicalToday);
  };

  // Sync on mount
  useEffect(() => {
    handleRefresh();
  }, [repositories]);

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
      <Text style={styles.title}>Your Garden</Text>
      <Text style={styles.subtitle}>
        Your habits grow here. Each category has a plant that reflects your consistency.
      </Text>

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
      ) : (
        <View style={styles.grid}>
          {plants.map((plant) => (
            <View key={plant.habit.id} style={styles.gridItem}>
              <Plant 
                stage={plant.streak.plantStage} 
                health={plant.streak.healthState} 
                color={plant.category.color}
                label={plant.habit.name} 
                size={100} 
              />
            </View>
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
  });
}
