import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import type { Category, Habit } from '@/src/types/models';
import { PlusIcon, ChevronRightIcon, GardenIcon } from '@/src/components/ui/Icon';

type PlantData = { habit: Habit; category: Category };

export default function PlantsListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();
  const styles = makeStyles(theme);

  const [isLoading, setIsLoading] = useState(true);
  const [plants, setPlants] = useState<PlantData[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [cats, habs] = await Promise.all([
          repositories.categories.getAll(),
          repositories.habits.getAll(),
        ]);
        const catMap = new Map(cats.map(c => [c.id, c]));
        
        const merged: PlantData[] = habs
          .map(h => ({ habit: h, category: catMap.get(h.categoryId) }))
          .filter(p => p.category !== undefined) as PlantData[];
        
        setPlants(merged);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [repositories]);

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
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Manage Plants</Text>
        <Pressable onPress={() => router.push('/plants/new' as any)} style={styles.addButton}>
          <PlusIcon size={24} color={theme.colors.accent} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {plants.length === 0 ? (
          <View style={styles.emptyState}>
            <GardenIcon size={48} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>No plants yet</Text>
            <Text style={styles.emptyBody}>
              Create your first plant (habit) to start growing your garden.
            </Text>
          </View>
        ) : (
          plants.map((plant) => (
            <Pressable
              key={plant.habit.id}
              style={styles.card}
              onPress={() => router.push(`/plants/${plant.habit.id}` as any)}
            >
              <View style={[styles.colorDot, { backgroundColor: plant.category.color }]} />
              <View style={styles.cardContent}>
                <Text style={styles.habitName}>{plant.habit.name}</Text>
                <Text style={styles.categoryName}>{plant.category.name}</Text>
              </View>
              <ChevronRightIcon size={20} color={theme.colors.textTertiary} />
            </Pressable>
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
    backButton: { padding: spacing.xs },
    backButtonText: { color: theme.colors.accent, fontFamily: 'Inter_500Medium', fontSize: 16 },
    headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: theme.colors.textPrimary },
    addButton: { padding: spacing.xs },
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
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      marginBottom: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: spacing.md },
    cardContent: { flex: 1 },
    habitName: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.colors.textPrimary },
    categoryName: { fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  });
}
