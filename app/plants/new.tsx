import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Theme } from '@/src/design/theme';
import { spacing, maxContentWidth } from '@/src/design/tokens';
import { useRepositories } from '@/src/db/provider';
import { PlantForm } from '@/src/components/garden/PlantForm';
import type { Category } from '@/src/types/models';

export default function NewPlantScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();
  const styles = makeStyles(theme);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const cats = await repositories.categories.getAll();
      setCategories(cats);
      setIsLoading(false);
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
          <Text style={styles.backButtonText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Plant</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.content}>
        <PlantForm
          categories={categories}
          submitLabel="Plant Seed"
          onSubmit={async (data) => {
            await repositories.habits.create(data);
            router.back();
          }}
        />
      </View>
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
    backButton: { padding: spacing.xs, minWidth: 60 },
    backButtonText: { color: theme.colors.accent, fontFamily: 'Inter_500Medium', fontSize: 16 },
    headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: theme.colors.textPrimary },
    content: { flex: 1, maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' },
  });
}
